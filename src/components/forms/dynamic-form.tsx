import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define the field type for our form schema
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'tel' | 'url' | 'textarea' | 'checkbox' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[]; // For select fields
  defaultValue?: any;
}

// Define a section type that contains fields
export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

// The complete form schema
export interface DynamicFormSchema {
  title: string;
  sections: FormSection[];
}

interface DynamicFormProps {
  schema: DynamicFormSchema;
  initialData?: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => void;
  readOnly?: boolean;
}

export function DynamicForm({ schema, initialData = {}, onSubmit, readOnly = false }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [editing, setEditing] = useState(false);

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    setEditing(false);
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData(initialData);
    setEditing(false);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] !== undefined ? formData[field.id] : field.defaultValue;
    const isFieldReadOnly = readOnly || !editing;

    switch (field.type) {
      case 'textarea':
        return (
          <div className="mb-4" key={field.id}>
            <Label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={value || ''}
              readOnly={isFieldReadOnly}
              className={cn("w-full", isFieldReadOnly && "bg-gray-50 dark:bg-gray-800")}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2 mb-4" key={field.id}>
            <Checkbox
              id={field.id}
              checked={!!value}
              disabled={isFieldReadOnly}
              onCheckedChange={(checked) => handleChange(field.id, !!checked)}
            />
            <Label
              htmlFor={field.id}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
          </div>
        );

      case 'select':
        return (
          <div className="mb-4" key={field.id}>
            <Label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {isFieldReadOnly ? (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                {field.options?.find(opt => opt.value === value)?.label || value || ''}
              </div>
            ) : (
              <Select
                value={value || ''}
                onValueChange={(val) => handleChange(field.id, val)}
                disabled={isFieldReadOnly}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="mb-4" key={field.id}>
            <Label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {isFieldReadOnly ? (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                {value !== undefined ? value : ''}
              </div>
            ) : (
              <Input
                id={field.id}
                type="number"
                placeholder={field.placeholder}
                value={value !== undefined ? value : ''}
                readOnly={isFieldReadOnly}
                className={cn("w-full", isFieldReadOnly && "bg-gray-50 dark:bg-gray-800")}
                onChange={(e) => handleChange(field.id, e.target.value ? parseFloat(e.target.value) : null)}
                required={field.required}
              />
            )}
          </div>
        );

      default:
        return (
          <div className="mb-4" key={field.id}>
            <Label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {isFieldReadOnly ? (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                {value || ''}
              </div>
            ) : (
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={value || ''}
                readOnly={isFieldReadOnly}
                className={cn("w-full", isFieldReadOnly && "bg-gray-50 dark:bg-gray-800")}
                onChange={(e) => handleChange(field.id, e.target.value)}
                required={field.required}
              />
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{schema.title}</h2>
        <div className="space-x-2">
          {!readOnly && (
            editing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSubmit}>Save</Button>
              </>
            ) : (
              <Button onClick={handleEdit}>Edit Form</Button>
            )
          )}
        </div>
      </div>

      {schema.sections.map(section => (
        <Card key={section.id} className="mb-6">
          <CardHeader className="py-4">
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map(field => (
                <div key={field.id} className={cn(
                  field.type === 'textarea' ? 'col-span-1 md:col-span-2' : ''
                )}>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {!readOnly && (
        <CardFooter className="flex justify-end space-x-2 p-5 border-t dark:border-gray-700">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSubmit}>Save Changes</Button>
            </>
          ) : (
            <Button onClick={handleEdit}>Edit Form</Button>
          )}
        </CardFooter>
      )}
    </div>
  );
} 