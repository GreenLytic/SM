import React, { useEffect, useState } from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Invoice } from '../types/invoice';
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
  },
  cooperativeLocation: {
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
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
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    justifyContent: 'space-between',
  },
  label: {
    width: '40%',
    fontWeight: '700',
  },
  value: {
    width: '60%',
    textAlign: 'right',
  },
  costs: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 10,
  },
  certifications: {
    marginTop: 5,
    fontSize: 10,
    color: '#666',
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  producerName: string;
}

export default function InvoicePDF({ invoice, producerName }: InvoicePDFProps) {
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
    return `${formatNumber(amount)} FCFA`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
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
          <Text style={styles.title}>FACTURE N° {invoice.invoiceNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Générales</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date d'émission:</Text>
            <Text style={styles.value}>
              {format(invoice.date, 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date d'échéance:</Text>
            <Text style={styles.value}>
              {format(invoice.dueDate, 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Producteur:</Text>
            <Text style={styles.value}>{producerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>N° Stock:</Text>
            <Text style={styles.value}>{invoice.stockNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Quantité:</Text>
            <Text style={styles.value}>{formatWeight(invoice.quantity)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Qualité:</Text>
            <Text style={styles.value}>Qualité {invoice.quality}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Prix de base:</Text>
            <Text style={styles.value}>{formatMoney(invoice.basePrice)} /kg</Text>
          </View>
          {invoice.qualityPremium > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Prime qualité:</Text>
              <Text style={styles.value}>{formatMoney(invoice.qualityPremium)} /kg</Text>
            </View>
          )}
          {invoice.certificationPremiums > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Primes certification:</Text>
              <Text style={styles.value}>{formatMoney(invoice.certificationPremiums)} /kg</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paiement</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Montant total:</Text>
            <Text style={styles.value}>{formatMoney(invoice.totalAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Montant payé:</Text>
            <Text style={styles.value}>{formatMoney(invoice.amountPaid)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reste à payer:</Text>
            <Text style={styles.value}>{formatMoney(invoice.totalAmount - invoice.amountPaid)}</Text>
          </View>
        </View>

        {invoice.paymentHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique des paiements</Text>
            {invoice.paymentHistory.map((payment, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.label}>
                  {format(payment.date.toDate(), 'dd/MM/yyyy')}:
                </Text>
                <Text style={styles.value}>{formatMoney(payment.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          Document généré le {today}
        </Text>
      </Page>
    </Document>
  );
}