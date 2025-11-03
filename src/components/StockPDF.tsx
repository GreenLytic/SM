import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { StockEntry } from '../types/stock';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: '#2F5E1E',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    color: '#444',
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
  gradeBadge: {
    padding: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    width: 80,
  },
  gradeI: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  gradeII: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  rejected: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  producerSection: {
    marginTop: 10,
    marginBottom: 5,
  },
  producerTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  producerRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingVertical: 2,
    borderBottom: '1px solid #f3f4f6',
  },
  producerName: {
    width: '50%',
    fontSize: 10,
  },
  producerValue: {
    width: '25%',
    fontSize: 10,
    textAlign: 'right'
  },
});

interface StockPDFProps {
  stock: StockEntry;
  producerName: string;
  producerNames?: Record<string, string> | undefined;
}

export default function StockPDF({ stock, producerName, producerNames }: StockPDFProps) {
  const today = format(new Date(), 'dd MMMM yyyy', { locale: fr });

  const getGradeStyle = (quality: string) => {
    switch (quality) {
      case 'A': return styles.gradeI;
      case 'B': return styles.gradeII;
      case 'C': return styles.rejected;
      default: return {};
    }
  };

  const getGradeText = (quality: string) => {
    switch (quality) {
      case 'A': return 'Grade I';
      case 'B': return 'Grade II';
      case 'C': return 'Refusé';
      default: return 'Non évalué';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>FICHE DE STOCK</Text>
          <Text style={styles.subtitle}>N° {stock.stockNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Générales</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{format(stock.date, 'dd MMMM yyyy', { locale: fr })}</Text>
          </View>
          
          {!stock.multipleProducers ? (
            <View style={styles.row}>
              <Text style={styles.label}>Producteur:</Text>
              <Text style={styles.value}>{producerName}</Text>
            </View>
          ) : (
            <View style={styles.row}>
              <Text style={styles.label}>Stock combiné:</Text>
              <Text style={styles.value}>{stock.producerInfo?.length || 0} producteurs</Text>
            </View>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>Numéro de stock:</Text>
            <Text style={styles.value}>{stock.stockNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du Stock</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Quantité actuelle:</Text>
            <Text style={styles.value}>{stock.quantity.toFixed(2)} tonnes</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quantité initiale:</Text>
            <Text style={styles.value}>{(stock.originalQuantity || stock.quantity).toFixed(2)} tonnes</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sacs actuels:</Text>
            <Text style={styles.value}>{stock.bagCount || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sacs total:</Text>
            <Text style={styles.value}>{stock.originalBagCount || stock.bagCount || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Humidité:</Text>
            <Text style={styles.value}>{stock.humidity}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Grade:</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '60%' }}>
              <View style={[styles.gradeBadge, getGradeStyle(stock.quality)]}>
                <Text>{stock.calculatedGrade || getGradeText(stock.quality)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Producer details for combined stocks */}
        {stock.multipleProducers && stock.producerInfo && stock.producerInfo.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails des producteurs</Text>
            
            <View style={styles.producerRow}>
              <Text style={[styles.producerName, { fontWeight: 'bold' }]}>Producteur</Text>
              <Text style={[styles.producerValue, { fontWeight: 'bold' }]}>Quantité</Text>
              <Text style={[styles.producerValue, { fontWeight: 'bold' }]}>Sacs</Text>
            </View>
            
            {stock.producerInfo.map((info, index) => (
              <View key={index} style={styles.producerRow}>
                <Text style={styles.producerName}>
                  {producerNames[info.producerId] || `Producteur ${index + 1}`}
                </Text>
                <Text style={styles.producerValue}>{info.quantity.toFixed(2)} tonnes</Text>
                <Text style={styles.producerValue}>{info.bagCount || 'N/A'}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Financières</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Prix par tonne:</Text>
            <Text style={styles.value}>{stock.pricePerTon.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Montant total:</Text>
            <Text style={styles.value}>{stock.totalCost.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Montant payé:</Text>
            <Text style={styles.value}>{stock.amountPaid.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Statut de paiement:</Text>
            <Text style={styles.value}>
              {stock.paymentStatus === 'pending' ? 'En attente' : 
               stock.paymentStatus === 'partial' ? 'Partiel' : 'Complété'}
            </Text>
          </View>
        </View>

        {stock.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{stock.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Document généré le {today}
        </Text>
      </Page>
    </Document>
  );
}