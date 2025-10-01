import { supabase } from "@/integrations/supabase/client";

export const licenseService = {
  // Upload license document
  uploadLicense: async (file: File, userId: string) => {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `licenses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('license-uploads')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {throw uploadError;}

      // Create license record in database
      const { data: license, error: insertError } = await (supabase
        .from('licenses') as any)
        .insert({
          user_id: userId,
          storage_path: filePath,
          verified: false
        })
        .select()
        .single();

      if (insertError) {
        // Rollback file upload if database insert fails
        await supabase.storage.from('license-uploads').remove([filePath]);
        throw insertError;
      }

      return { success: true, licenseId: (license as any).id, filePath };
    } catch (error: any) {
      console.error("License upload error:", error);
      return { success: false, error: error?.message };
    }
  },

  // Get signed URL for license preview
  getLicensePreviewUrl: async (storagePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('license-uploads')
        .createSignedUrl(storagePath, 3600); // URL valid for 1 hour

      if (error) {throw error;}

      return { success: true, url: data.signedUrl };
    } catch (error: any) {
      console.error("License preview URL error:", error);
      return { success: false, error: error?.message };
    }
  },

  // Get user's licenses
  getUserLicenses: async (userId: string) => {
    try {
      const { data: licenses, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {throw error;}

      return { success: true, licenses };
    } catch (error: any) {
      console.error("Get user licenses error:", error);
      return { success: false, error: error?.message };
    }
  }
};