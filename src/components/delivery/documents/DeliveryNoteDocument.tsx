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

interface DeliveryNoteDocumentProps {
  delivery: DeliveryOrder;
}

export default function DeliveryNoteDocument({ delivery }: DeliveryNoteDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>BON DE LIVRAISON</Text>
          <Text style={styles.subtitle}>N° {delivery.orderNumber}</Text>
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
            <Text style={styles.value}>{delivery.destination || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Adresse de livraison:</Text>
            <Text style={styles.value}>{delivery.deliveryAddress}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la cargaison</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Poids total:</Text>
            <Text style={styles.value}>{delivery.totalWeight.toFixed(2)} tonnes</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre de produits:</Text>
            <Text style={styles.value}>{delivery.products.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Livraison partielle:</Text>
            <Text style={styles.value}>{delivery.partialDelivery ? 'Oui' : 'Non'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produits livrés</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Stock/Lot</Text>
              <Text style={styles.tableCell}>Qualité</Text>
              <Text style={styles.tableCell}>Quantité</Text>
            </View>
            {delivery.products.map((product, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>
                  {product.stockId.substring(0, 8)}
                  {product.lotId && ' (Lot)'}
                </Text>
                <Text style={styles.tableCell}>Qualité {product.quality}</Text>
                <Text style={styles.tableCell}>{product.quantity.toFixed(2)} tonnes</Text>
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
        </View>

        {delivery.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{delivery.notes}</Text>
          </View>
        )}

        <View style={styles.signatureSection}>
          <View>
            <View style={styles.signatureBox} />
            <Text style={styles.signatureLabel}>Signature du responsable</Text>
          </View>
          <View>
            <View style={styles.signatureBox} />
            <Text style={styles.signatureLabel}>Signature du client</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
        </Text>
      </Page>
    </Document>
  );
}