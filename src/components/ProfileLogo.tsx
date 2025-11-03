import React, { useState, useRef } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Upload, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Compressor from 'compressorjs';

interface ProfileLogoProps {
  currentLogo?: string;
  onLogoUpdate: (url: string) => void;
}

export default function ProfileLogo({ currentLogo, onLogoUpdate }: ProfileLogoProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    try {
      setIsUploading(true);

      // Compress image before upload
      new Compressor(file, {
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
        success: async (compressedFile) => {
          const storage = getStorage();
          const fileExtension = file.name.split('.').pop() || 'jpg';
          const fileName = `profile_logos/${Date.now()}.${fileExtension}`;
          const storageRef = ref(storage, fileName);

          // Delete old logo if exists
          if (currentLogo) {
            try {
              const oldLogoRef = ref(storage, currentLogo);
              await deleteObject(oldLogoRef);
            } catch (error) {
              console.error('Error deleting old logo:', error);
            }
          }

          // Upload new logo
          const uploadResult = await uploadBytes(storageRef, compressedFile);
          const downloadUrl = await getDownloadURL(uploadResult.ref);

          // Update profile with new logo URL
          const profileRef = doc(db, 'cooperativeInfo', 'settings');
          await updateDoc(profileRef, {
            logo: downloadUrl
          });

          onLogoUpdate(downloadUrl);
          toast.success('Logo mis à jour avec succès');
        },
        error: (err) => {
          console.error('Error compressing image:', err);
          toast.error('Erreur lors du traitement de l\'image');
        },
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erreur lors du téléchargement du logo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {currentLogo ? (
          <img
            src={currentLogo}
            alt="Logo"
            className="w-24 h-24 rounded-full object-cover border-2 border-[#2F5E1E]"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <label
          className="absolute bottom-0 right-0 p-2 bg-[#2F5E1E] rounded-full cursor-pointer hover:bg-[#1F3D13] transition-colors"
          htmlFor="logo-upload"
        >
          {isUploading ? (
            <Loader className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Upload className="w-4 h-4 text-white" />
          )}
        </label>
        <input
          id="logo-upload"
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>
      <p className="text-sm text-gray-500">
        Format: PNG, JPG, GIF (max. 5MB)
      </p>
    </div>
  );
}