import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { DeliveryOrder } from '../../../types/delivery';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff'
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2F5E1E'
  },
  deliveryNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
    padding: 15,
    border: '4px solid #2F5E1E',
    borderRadius: 8,
    backgroundColor: '#FAFFF8'
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
    color: '#2F5E1E',
    borderBottom: '1px solid #2F5E1E',
    paddingBottom: 3
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center'
  },
  label: {
    width: '40%',
    fontSize: 13,
    fontWeight: '700',
    color: '#333'
  },
  value: {
    width: '60%',
    fontSize: 13,
    color: '#000'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#6B7280'
  },
  qrCode: {
    width: 100,
    height: 100,
    marginVertical: 10,
    alignSelf: 'center',
    border: '1px solid #000',
    padding: 5
  },
  qrCodeText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
    color: '#666'
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'dashed',
    marginVertical: 10
  },
  qualityBadge: {
    alignSelf: 'center',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    fontWeight: '700',
    fontSize: 14
  },
  destination: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 10
  },
  warning: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    fontSize: 10
  }
});

interface LogisticLabelDocumentProps {
  delivery: DeliveryOrder;
}

export default function LogisticLabelDocument({ delivery }: LogisticLabelDocumentProps) {
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

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <Text style={styles.header}>ÉTIQUETTE LOGISTIQUE</Text>
        <Text style={styles.deliveryNumber}>{delivery.orderNumber}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS</Text>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{format(delivery.deliveryDate, 'dd MMMM yyyy', { locale: fr })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Acheteur:</Text>
            <Text style={styles.value}>{delivery.buyerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Poids total:</Text>
            <Text style={styles.value}>{delivery.totalWeight.toFixed(2)} tonnes</Text>
          </View>
          
          <Text style={styles.destination}>
            {delivery.destination || delivery.deliveryAddress}
          </Text>
          
          <Text style={styles.qualityBadge}>
            Qualité {getMainQuality()}
          </Text>
          
          {/* QR Code placeholder - in a real app, you would generate a QR code here */}
          <View style={styles.qrCode} />
          <Text style={styles.qrCodeText}>
            {delivery.orderNumber} • {delivery.totalWeight.toFixed(2)} tonnes
          </Text>
          
          {delivery.partialDelivery && (
            <Text style={styles.warning}>
              ATTENTION: Cette livraison contient des stocks partiellement livrés.
              Vérifiez les quantités avec soin.
            </Text>
          )}
        </View>
        
        <Text style={styles.footer}>
          Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })} • SMARTCOOP
        </Text>
      </Page>
    </Document>
  );
}