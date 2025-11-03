import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CooperativeInfo } from '../../types/cooperative';
import { Building2, MapPin, Award, Phone, Mail, Globe, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LocationPicker from '../LocationPicker';

interface CooperativeFormProps {
  onClose: () => void;
}

export default function CooperativeForm({ onClose }: CooperativeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [info, setInfo] = useState<CooperativeInfo>({
    name: '',
    location: '',
    coordinates: [0, 0],
    address: '',
    phone: '',
    email: '',
    website: '',
    registrationNumber: '',
    taxId: '',
    certifications: [],
    bankDetails: {
      bankName: '',
      accountNumber: '',
      swift: ''
    },
    legalRepresentative: ''
  });

  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    const fetchCooperativeInfo = async () => {
      try {
        const docRef = doc(db, 'cooperativeInfo', 'settings');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as CooperativeInfo;
          setInfo({
            name: data.name || '',
            location: data.location || '',
            coordinates: data.coordinates || [0, 0],
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            registrationNumber: data.registrationNumber || '',
            taxId: data.taxId || '',
            certifications: data.certifications || [],
            bankDetails: data.bankDetails || {
              bankName: '',
              accountNumber: '',
              swift: ''
            },
            legalRepresentative: data.legalRepresentative || ''
          });
        }
      } catch (error) {
        console.error('Error fetching cooperative info:', error);
        toast.error('Erreur lors du chargement des informations');
      }
    };

    fetchCooperativeInfo();
  }, []);

  const handleLocationChange = (address: string, coordinates: [number, number]) => {
    setInfo(prev => ({
      ...prev,
      location: address,
      coordinates
    }));
  };

  const handleAddCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCertification.trim()) {
      setInfo(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (index: number) => {
    setInfo(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const docRef = doc(db, 'cooperativeInfo', 'settings');
      await setDoc(docRef, {
        ...info,
        updatedAt: new Date()
      });

      document.title = info.name;
      const titleElement = document.getElementById('app-title');
      if (titleElement) {
        titleElement.textContent = info.name;
      }

      toast.success('Informations mises à jour avec succès');
      onClose();
    } catch (error) {
      console.error('Error saving cooperative info:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Building2 className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Informations de la Coopérative
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Nom de la coopérative
          </label>
          <input
            type="text"
            required
            value={info.name}
            onChange={(e) => setInfo(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
          <LocationPicker
            value={info.location}
            onChange={handleLocationChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Adresse complète
            </div>
          </label>
          <input
            type="text"
            required
            value={info.address}
            onChange={(e) => setInfo(prev => ({ ...prev, address: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Adresse postale complète"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Téléphone
            </div>
          </label>
          <input
            type="tel"
            required
            value={info.phone}
            onChange={(e) => setInfo(prev => ({ ...prev, phone: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </div>
          </label>
          <input
            type="email"
            required
            value={info.email}
            onChange={(e) => setInfo(prev => ({ ...prev, email: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Site web
            </div>
          </label>
          <input
            type="url"
            value={info.website}
            onChange={(e) => setInfo(prev => ({ ...prev, website: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              N° d'enregistrement
            </div>
          </label>
          <input
            type="text"
            required
            value={info.registrationNumber}
            onChange={(e) => setInfo(prev => ({ ...prev, registrationNumber: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              N° d'identification fiscale
            </div>
          </label>
          <input
            type="text"
            required
            value={info.taxId}
            onChange={(e) => setInfo(prev => ({ ...prev, taxId: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Certifications
            </div>
          </label>
          <div className="mt-2 space-y-2">
            {info.certifications.map((cert, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                  {cert}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveCertification(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nouvelle certification"
              />
              <button
                type="button"
                onClick={handleAddCertification}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations bancaires</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom de la banque</label>
              <input
                type="text"
                required
                value={info.bankDetails.bankName}
                onChange={(e) => setInfo(prev => ({
                  ...prev,
                  bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Numéro de compte</label>
              <input
                type="text"
                required
                value={info.bankDetails.accountNumber}
                onChange={(e) => setInfo(prev => ({
                  ...prev,
                  bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Code SWIFT</label>
              <input
                type="text"
                value={info.bankDetails.swift}
                onChange={(e) => setInfo(prev => ({
                  ...prev,
                  bankDetails: { ...prev.bankDetails, swift: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Représentant légal
          </label>
          <input
            type="text"
            required
            value={info.legalRepresentative}
            onChange={(e) => setInfo(prev => ({ ...prev, legalRepresentative: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Nom complet du représentant légal"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            'Enregistrer'
          )}
        </button>
      </div>
    </form>
  );
}