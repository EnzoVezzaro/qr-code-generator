import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Participant } from '@/types';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox'; // Import Checkbox as named export
import { generateQRToken } from '@/lib/utils';

interface BulkImportModalProps {
  eventId: string;
  onClose: () => void;
  onImportSuccess: () => void; // Callback to refresh participant list
}

interface ImportedParticipant {
  name: string;
  email: string;
  identifier: string;
  id?: string; // Add temporary unique ID for modal
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ eventId, onClose, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importedParticipants, setImportedParticipants] = useState<ImportedParticipant[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set()); // State for selected participants (using temporary IDs)


  // Helper function to clean up unwanted characters
  const cleanText = (text: string): string => {
    // This regex attempts to remove common RTF control words and other non-standard characters.
    // It's a basic approach and might need refinement based on actual file content variations.
    // It keeps standard text, numbers, emails, and basic punctuation.
    return text.replace(/\\([a-z]+[0-9]*|.)|[{}]/g, '').replace(/[^\x20-\x7E\r\n\t]/g, '');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportedParticipants(null); // Clear previous data
      setError(null);
      readFile(selectedFile);
    }
  };

  const readFile = (selectedFile: File) => {
    setLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        let parsedData: ImportedParticipant[] = [];
        if (selectedFile.type === 'text/csv') {
          parsedData = parseCSV(content);
        } else if (selectedFile.type === 'text/plain') {
          parsedData = parseTXT(content);
        } else {
          throw new Error('Unsupported file type. Please upload a CSV or TXT file.');
        }

        if (parsedData.length === 0) {
            setError('No data found in the file.');
            setImportedParticipants(null);
        } else {
             // Add a temporary unique ID to each participant for selection purposes
             const participantsWithIds = parsedData.map(p => ({
                 ...p,
                 id: crypto.randomUUID(), // Generate a unique ID for each row
             }));
             setImportedParticipants(participantsWithIds);
             setSelectedParticipantIds(new Set(participantsWithIds.map(p => p.id!))); // Select all by default
        }
       
      } catch (err: any) {
        console.error('Error parsing file:', err);
        setError(`Error parsing file: ${err.message}`);
        setImportedParticipants(null);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setLoading(false);
      setError('Failed to read file.');
      setImportedParticipants(null);
    };

    reader.readAsText(selectedFile);
  };

  // Handle select all checkbox change
  const handleSelectAllChange = (checked: boolean) => {
    if (!importedParticipants) return;

    if (checked) {
      const allIds = new Set(importedParticipants.map(p => p.id!));
      setSelectedParticipantIds(allIds);
    } else {
      setSelectedParticipantIds(new Set());
    }
  };

  // Handle individual participant checkbox change
  const handleParticipantSelectChange = (id: string, checked: boolean) => {
    setSelectedParticipantIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (checked) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
      return newSelected; // Return the new Set instance
    });
  };


  const parseCSV = (content: string): ImportedParticipant[] => {
    const cleanedContent = cleanText(content); // Clean the entire content first
    const lines = cleanedContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
    const requiredHeaders = ['name', 'email', 'identifier'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

    if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}. Required headers are: ${requiredHeaders.join(', ')}.`);
    }

    const dataLines = lines.slice(1);
    return dataLines.map(line => {
      const values = line.split(',').map(value => value.trim().replace(/\\+$/, '')); // Trim and remove trailing backslashes
      const participant: any = {};
      headers.forEach((header, index) => {
        participant[header] = values[index];
      });
      // Basic validation
      if (!participant.name || !participant.email || !participant.identifier) {
          console.warn('Skipping row due to missing required fields:', participant);
          return null; // Skip rows with missing required fields
      }
      return participant as ImportedParticipant;
    }).filter(p => p !== null) as ImportedParticipant[]; // Filter out nulls
  };

  const parseTXT = (content: string): ImportedParticipant[] => {
     // Assuming TXT format is one participant per line, comma-separated: name,email,identifier
    const cleanedContent = cleanText(content); // Clean the entire content first
    const lines = cleanedContent.split('\n').filter(line => line.trim() !== '');
     if (lines.length === 0) return [];

     return lines.map(line => {
        const parts = line.split(',').map(part => part.trim().replace(/\\+$/, '')); // Trim and remove trailing backslashes
        if (parts.length >= 3) {
            // Basic validation
            if (!parts[0] || !parts[1] || !parts[2]) {
                console.warn('Skipping row due to missing required fields in TXT:', line);
                return null; // Skip rows with missing required fields
            }
            return {
                name: parts[0],
                email: parts[1],
                identifier: parts[2],
            } as ImportedParticipant;
        } else {
            console.warn('Skipping invalid TXT row:', line);
            return null; // Skip invalid rows
        }
     }).filter(p => p !== null) as ImportedParticipant[]; // Filter out nulls
  };


  const handleImportParticipants = async () => {
    if (!importedParticipants || selectedParticipantIds.size === 0 || importing || !eventId) return; // Check selected count

    setImporting(true);
    setError(null);

    // Filter participants to insert based on selection (using temporary IDs)
    // Map back to the original structure for insertion
    const participantsToInsert = importedParticipants
      .filter(p => selectedParticipantIds.has(p.id!)) // Filter by temporary ID
      .map(p => ({
        name: p.name, // Use original data for insertion
        email: p.email,
        identifier: p.identifier,
        event_id: eventId,
        qr_usage_count: 0, // Default value
        is_revoked: false, // Default value
        qr_token: generateQRToken(),
      }));

    if (participantsToInsert.length === 0) {
        setError('No participants selected for import.');
        setImporting(false);
        return;
    }

    try {
      // Insert participants in batches to avoid hitting database limits
      const batchSize = 50;
      for (let i = 0; i < participantsToInsert.length; i += batchSize) {
        const batch = participantsToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('participants')
          .insert(batch);

        if (insertError) {
             // If there's a unique constraint violation, Supabase might return an error
             // We might need more sophisticated error handling here to report which rows failed
             console.error('Batch insert error:', insertError);
             throw new Error(`Failed to import batch: ${insertError.message}`);
        }
      }

      console.log('Participants imported successfully');
      onImportSuccess(); // Refresh the list in the parent component
      onClose(); // Close the modal

    } catch (err: any) {
      console.error('Error importing participants:', err);
      setError(`Error importing participants: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file">Upload CSV or TXT File</Label>
        <Input
          id="file"
          type="file"
          accept=".csv, .txt"
          className='mt-2'
          onChange={handleFileChange}
        />
      </div>

      <div className="text-sm text-muted-foreground mt-2">
        Download sample files: <a href="/assets/samples/sample.csv" download className="text-primary hover:underline">CSV</a>, <a href="/assets/samples/sample.txt" download className="text-primary hover:underline">TXT</a>
      </div>

      {loading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Reading file...</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {importedParticipants && importedParticipants.length > 0 && (
        <div className="space-y-4">
          <p className="font-medium">{importedParticipants.length} participants found in file:</p>
          <div className="max-h-60 overflow-y-auto border rounded-md">
            <table className="w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted/50">
                   <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                     <Checkbox
                       checked={importedParticipants?.length > 0 && selectedParticipantIds.size === importedParticipants.length} // Corrected variable name
                       onCheckedChange={handleSelectAllChange}
                     />
                   </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Identifier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {importedParticipants.map((p) => (
                  <tr key={p.id}> {/* Use temporary ID as key */}
                     <td className="px-4 py-2 text-sm">
                       <Checkbox
                         checked={selectedParticipantIds.has(p.id!)} // Use temporary ID for checked state
                         onCheckedChange={(checked) => handleParticipantSelectChange(p.id!, checked as boolean)} // Use temporary ID for handler
                       />
                     </td>
                    <td className="px-4 py-2 text-sm">{p.name}</td>
                    <td className="px-4 py-2 text-sm">{p.email}</td>
                    <td className="px-4 py-2 text-sm">{p.identifier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Display selected count */}
          <p className="text-sm text-muted-foreground">
            {selectedParticipantIds.size} participant{selectedParticipantIds.size !== 1 ? 's' : ''} selected
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={handleImportParticipants} disabled={importing}>
              {importing ? 'Importing...' : 'Import Participants'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImportModal;
