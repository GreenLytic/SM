import React, { useEffect, useState } from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { DeliveryOrder } from '../types/delivery';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CooperativeInfo } from '../types/cooperative';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10,
    borderBottomColor: '#2F5E1E',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  cooperativeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  cooperativeName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
    color: '#2F5E1E',
  },
  cooperativeLocation: {
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
    backgroundColor: '#f3f4f6',
    padding: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#2F5E1E',
    borderLeftStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  label: {
    width: '40%',
    fontWeight: '700',
    color: '#444',
  },
  value: {
    width: '60%',
    textAlign: 'right',
    color: '#333',
  },
  costs: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  certifications: {
    marginTop: 5,
    fontSize: 10,
    color: '#666',
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontWeight: '700',
    width: '40%',
  },
  totalValue: {
    fontWeight: '700',
    width: '60%',
    textAlign: 'right',
  },
  profitValue: {
    width: '60%',
    textAlign: 'right',
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
  },
  tableCell: {
    padding: 5,
    flex: 1,
  },
  tableCellHeader: {
    padding: 5,
    flex: 1,
    fontWeight: '700',
    color: '#4b5563',
  },
  qrCode: {
    width: 80,
    height: 80,
    marginVertical: 10,
    alignSelf: 'center',
  },
});

interface DeliveryReportPDFProps {
  delivery: DeliveryOrder;
}

export default function DeliveryReportPDF({ delivery }: DeliveryReportPDFProps) {
  const [cooperativeInfo, setCooperativeInfo] = useState<CooperativeInfo | null>(null);
  const today = format(new Date(), 'dd MMMM yyyy', { locale: fr }); 

  useEffect(() => {
    const fetchCooperativeInfo = async () => {
      try {
        const docRef = doc(db, 'cooperativeInfo', 'settings');
        const docSnap = await getDoc(docRef);
        // Définir des valeurs par défaut même si les données n'existent pas
        const defaultCooperative = {
          name: 'SMARTCOOP',
          location: 'Abidjan',
          coordinates: [5.9309666, -4.2143906]
        };
        
        setCooperativeInfo(docSnap.exists() ? docSnap.data() as CooperativeInfo : defaultCooperative);
      } catch (error) {
        console.error('Error fetching cooperative info:', error);
      }
    };

    fetchCooperativeInfo();
  }, []);

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const formatWeight = (weight: number) => {
    const kgs = Math.round(weight * 1000);
    return `${formatNumber(kgs)} kg`;
  };

  const formatMoney = (amount: number) => {
    return `${formatNumber(Math.round(amount))} FCFA`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.headerContent}>
            {cooperativeInfo?.logo && (
              <Image src={cooperativeInfo.logo} style={styles.logo} />
            )}
            <View style={styles.cooperativeInfo}>
              <Text style={styles.cooperativeName}>
                {cooperativeInfo?.name || 'SMARTCOOP'}
              </Text>
              <Text style={styles.cooperativeLocation}>
                {cooperativeInfo?.location}
              </Text>
              {cooperativeInfo?.certifications && cooperativeInfo.certifications.length > 0 && (
                <Text style={styles.certifications}>
                  Certifications: {cooperativeInfo.certifications.join(', ')}
                </Text>
              )}
            </View>
          </View>
          <Text style={styles.title}>RAPPORT DE LIVRAISON</Text>
          <Text style={styles.subtitle}>Commande N° {delivery.orderNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Générales</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date de livraison:</Text>
            <Text style={styles.value}>
              {format(delivery.deliveryDate, 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{delivery.buyerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Adresse de livraison:</Text>
            <Text style={styles.value}>{delivery.deliveryAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Statut:</Text>
            <Text style={styles.value}>
              {delivery.status === 'completed' ? 'Terminée' : 
               delivery.status === 'in-progress' ? 'En cours' : 
               delivery.status === 'pending' ? 'En attente' : 'Annulée'}
            </Text>
          </View>
          {delivery.completedAt && (
            <View style={styles.row}>
              <Text style={styles.label}>Date de complétion:</Text>
              <Text style={styles.value}>
                {format(delivery.completedAt, 'dd MMMM yyyy', { locale: fr })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la Cargaison</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Poids coopérative:</Text>
            <Text style={styles.value}>{formatWeight(delivery.totalWeight)}</Text>
          </View>
          {delivery.buyerWeight && (
            <View style={styles.row}>
              <Text style={styles.label}>Poids acheteur:</Text>
              <Text style={styles.value}>{formatWeight(delivery.buyerWeight)}</Text>
            </View>
          )}
          {delivery.weightLoss && delivery.weightLoss > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Perte de poids:</Text>
              <Text style={styles.value}>{formatWeight(delivery.weightLoss)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Qualité:</Text>
            <Text style={styles.value}>Qualité {delivery.quality}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Humidité:</Text>
            <Text style={styles.value}>{delivery.humidity}%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produits livrés</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellHeader}>Produit</Text>
              <Text style={styles.tableCellHeader}>Qualité</Text>
              <Text style={styles.tableCellHeader}>Quantité</Text>
            </View>
            {delivery.products && delivery.products.map((product, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>Stock #{product.stockId.substring(0, 8)}</Text>
                <Text style={styles.tableCell}>Qualité {product.quality}</Text>
                <Text style={styles.tableCell}>{formatWeight(product.quantity)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transport</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Véhicule:</Text>
            <Text style={styles.value}>{delivery.vehicleInfo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Chauffeur:</Text>
            <Text style={styles.value}>{delivery.driverInfo}</Text>
          </View>
          {delivery.notes && (
            <View style={styles.row}>
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{delivery.notes}</Text>
            </View>
          )}
        </View>

        {delivery.costs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aspects Financiers</Text>
            <View style={styles.costs}>
              <View style={styles.row}>
                <Text style={styles.label}>Prix de vente total:</Text>
                <Text style={styles.value}>{formatMoney(delivery.costs.sellingPrice)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Remboursement client:</Text>
                <Text style={styles.value}>{formatMoney(delivery.costs.buyerReimbursement)}</Text>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 10, fontSize: 12 }]}>Frais de livraison</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Frais de route:</Text>
                <Text style={styles.value}>{formatMoney(delivery.costs.roadFees)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Carburant:</Text>
                <Text style={styles.value}>{formatMoney(delivery.costs.fuelCost)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Location véhicule:</Text>
                <Text style={styles.value}>{formatMoney(delivery.costs.vehicleRental)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Chargement:</Text>
                <Text style={styles.value}>{formatMoney(delivery.costs.loadingCost)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Déchargement:</Text>
                <Text style={styles.value}>{formatMoney(delivery.costs.unloadingCost)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Autres frais:</Text>
                <Text style={styles.value}>{formatMoney(delivery.costs.otherCosts)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total des frais:</Text>
                <Text style={styles.value}>{formatMoney(delivery.costs.totalCost)}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Bénéfice:</Text>
                <Text style={[styles.profitValue, { color: delivery.costs.profit >= 0 ? '#059669' : '#DC2626' }]}>
                  {formatMoney(delivery.costs.profit)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature du responsable</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature du client</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Rapport généré le {today} • {cooperativeInfo?.name || 'SMARTCOOP'} • Document officiel
        </Text>
      </Page>
    </Document>
  );
}