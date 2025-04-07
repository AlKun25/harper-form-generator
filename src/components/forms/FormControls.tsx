import React from 'react';
import { useFormContext } from './FormProvider';
import { Button } from '@/components/ui/button';
import { Laptop, Trash, DownloadCloud, SaveAll, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FormControlsProps {
  onExport?: () => void;
  onSave?: () => void;
  className?: string;
}

export default function FormControls({ onExport, onSave, className = '' }: FormControlsProps) {
  const { 
    resetForm, 
    resetConversation, 
    useLangGraph,
    toggleLangGraph
  } = useFormContext();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the form? This will clear all data.')) {
      resetForm();
      resetConversation();
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleReset}
        className="flex items-center gap-2"
      >
        <Trash className="h-4 w-4" />
        Reset Form
      </Button>
      
      {onExport && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExport}
          className="flex items-center gap-2"
        >
          <DownloadCloud className="h-4 w-4" />
          Export
        </Button>
      )}
      
      {onSave && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSave}
          className="flex items-center gap-2"
        >
          <SaveAll className="h-4 w-4" />
          Save
        </Button>
      )}

      <div className="flex items-center space-x-2 ml-auto">
        <Label 
          htmlFor="lang-graph-mode" 
          className="flex items-center gap-2 text-sm cursor-pointer"
        >
          <Laptop className="h-4 w-4" />
          Standard
        </Label>
        <Switch
          id="lang-graph-mode"
          checked={useLangGraph}
          onCheckedChange={toggleLangGraph}
        />
        <Label 
          htmlFor="lang-graph-mode" 
          className="flex items-center gap-2 text-sm cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          LangGraph
        </Label>
      </div>
    </div>
  );
} 