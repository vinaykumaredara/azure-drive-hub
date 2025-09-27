// src/components/ui/forms/FormField.tsx
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';

interface CustomFormFieldProps {
  name: string;
  label: string;
  description?: string;
  children: React.ReactNode;
}

const CustomFormField = ({ name, label, description, children }: CustomFormFieldProps) => {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {children}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CustomFormField;