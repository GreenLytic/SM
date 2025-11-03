import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { DeliveryOrder } from '../../../types/delivery';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Create styles
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
    fontWeight: '700',
  },
  tableCell: {
    padding: 5,
    flex: 1,
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
  qualityBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qualityTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  qualityRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  qualityLabel: {
    width: '60%',
    fontSize: 10,
    color: '#444',
  },
  qualityValue: {
    width: '40%',
    fontSize: 10,
    textAlign: 'right',
  },
  gradeBadge: {
    alignSelf: 'center',
    padding: 8,
    marginVertical: 10,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    width: '50%',
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
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    height: 60,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 5,
  },
  signatureLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
  },
});

interface QualityCertificateDocumentProps {
  delivery: DeliveryOrder;
}

export default function QualityCertificateDocument({ delivery }: QualityCertificateDocumentProps) {
  // Déterminer la qualité dominante
  const getMainQuality = () => {
    const qualityCounts = delivery.products.reduce((acc, product) => {
      acc[product.quality] = (acc[product.quality] || 0) + product.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    let mainQuality = 'A';
    let maxQuantity = 0;
    
    for (const [quality, quantity] of Object.entries(qualityCounts)) {
      if (quantity > maxQuantity) {
        maxQuantity = quantity;
        mainQuality = quality;
      }
    }
    
    return mainQuality;
  };

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
      case 'C': return 'Grade Standard';
      default: return 'Non évalué';
    }
  };

  const mainQuality = getMainQuality();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>CERTIFICAT DE QUALITÉ</Text>
          <Text style={styles.subtitle}>Livraison N° {delivery.orderNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date de livraison:</Text>
            <Text style={styles.value}>
              {format(delivery.deliveryDate, 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Acheteur:</Text>
            <Text style={styles.value}>{delivery.buyerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Destination:</Text>
            <Text style={styles.value}>{delivery.destination || delivery.deliveryAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Poids total:</Text>
            <Text style={styles.value}>{delivery.totalWeight.toFixed(2)} tonnes</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certification de qualité</Text>
          
          <View style={[styles.gradeBadge, getGradeStyle(mainQuality)]}>
            <Text>{getGradeText(mainQuality)}</Text>
          </View>
          
          <View style={styles.qualityBox}>
            <Text style={styles.qualityTitle}>Caractéristiques du cacao</Text>
            
            <View style={styles.qualityRow}>
              <Text style={styles.qualityLabel}>Humidité moyenne:</Text>
              <Text style={styles.qualityValue}>7.2%</Text>
            </View>
            
            <View style={styles.qualityRow}>
              <Text style={styles.qualityLabel}>Fèves moisies:</Text>
              <Text style={styles.qualityValue}>{'< 3%'}</Text>
            </View>
            
            <View style={styles.qualityRow}>
              <Text style={styles.qualityLabel}>Fèves ardoisées:</Text>
              <Text style={styles.qualityValue}>{'< 3%'}</Text>
            </View>
            
            <View style={styles.qualityRow}>
              <Text style={styles.qualityLabel}>Fèves germées:</Text>
              <Text style={styles.qualityValue}>{'< 3%'}</Text>
            </View>
            
            <View style={styles.qualityRow}>
              <Text style={styles.qualityLabel}>Fèves insectées:</Text>
              <Text style={styles.qualityValue}>{'< 3%'}</Text>
            </View>
            
            <View style={styles.qualityRow}>
              <Text style={styles.qualityLabel}>Corps étrangers:</Text>
              <Text style={styles.qualityValue}>{'< 0.5%'}</Text>
            </View>
          </View>
          
          <View style={styles.qualityBox}>
            <Text style={styles.qualityTitle}>Certifications</Text>
            
            <View style={styles.qualityRow}>
              <Text style={styles.qualityLabel}>Certification biologique:</Text>
              <Text style={styles.qualityValue}>Oui</Text>
            </View>
            
            <View style={styles.qualityRow}>
              <Text style={styles.qualityLabel}>Certification équitable:</Text>
              <Text style={styles.qualityValue}>Oui</Text>
            </View>
            
            <View style={styles.qualityRow}>
              <Text style={styles.qualityLabel}>Certification Rainforest Alliance:</Text>
              <Text style={styles.qualityValue}>Oui</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail par produit</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Stock/Lot</Text>
              <Text style={styles.tableCell}>Qualité</Text>
              <Text style={styles.tableCell}>Quantité</Text>
              <Text style={styles.tableCell}>Grade</Text>
            </View>
            {delivery.products.map((product, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>
                  {product.stockId.substring(0, 8)}
                  {product.lotId && ' (Lot)'}
                </Text>
                <Text style={styles.tableCell}>Qualité {product.quality}</Text>
                <Text style={styles.tableCell}>{product.quantity.toFixed(2)} tonnes</Text>
                <Text style={styles.tableCell}>{getGradeText(product.quality)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View>
            <View style={styles.signatureBox} />
            <Text style={styles.signatureLabel}>Responsable qualité</Text>
          </View>
          <View>
            <View style={styles.signatureBox} />
            <Text style={styles.signatureLabel}>Directeur de la coopérative</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
        </Text>
      </Page>
    </Document>
  );
}