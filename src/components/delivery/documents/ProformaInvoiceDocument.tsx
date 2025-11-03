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
  },
  productCell: {
    width: '40%',
  },
  quantityCell: {
    width: '20%',
    textAlign: 'center',
  },
  priceCell: {
    width: '20%',
    textAlign: 'right',
  },
  totalCell: {
    width: '20%',
    textAlign: 'right',
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  totalLabel: {
    width: '60%',
    textAlign: 'right',
    fontWeight: '700',
    paddingRight: 5,
  },
  totalValue: {
    width: '20%',
    textAlign: 'right',
    fontWeight: '700',
  },
  paymentInfo: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
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

interface ProformaInvoiceDocumentProps {
  delivery: DeliveryOrder;
}

export default function ProformaInvoiceDocument({ delivery }: ProformaInvoiceDocumentProps) {
  // Calculer le prix unitaire (par tonne) en utilisant le prix de vente total
  const unitPrice = delivery.costs?.sellingPrice 
    ? delivery.costs.sellingPrice / delivery.totalWeight 
    : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>FACTURE PROFORMA</Text>
          <Text style={styles.subtitle}>N° {delivery.orderNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations client</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{delivery.buyerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Adresse de livraison:</Text>
            <Text style={styles.value}>{delivery.deliveryAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {format(delivery.deliveryDate, 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Référence:</Text>
            <Text style={styles.value}>{delivery.orderNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la facture</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.productCell]}>Description</Text>
              <Text style={[styles.tableCell, styles.quantityCell]}>Quantité</Text>
              <Text style={[styles.tableCell, styles.priceCell]}>Prix unitaire</Text>
              <Text style={[styles.tableCell, styles.totalCell]}>Total</Text>
            </View>
            
            {delivery.products.map((product, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.productCell]}>
                  Cacao Qualité {product.quality}
                  {product.lotId && ' (Lot)'}
                </Text>
                <Text style={[styles.tableCell, styles.quantityCell]}>
                  {product.quantity.toFixed(2)} tonnes
                </Text>
                <Text style={[styles.tableCell, styles.priceCell]}>
                  {unitPrice.toLocaleString()} FCFA
                </Text>
                <Text style={[styles.tableCell, styles.totalCell]}>
                  {(product.quantity * unitPrice).toLocaleString()} FCFA
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT:</Text>
            <Text style={styles.totalValue}>
              {(delivery.costs?.sellingPrice || 0).toLocaleString()} FCFA
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA (0%):</Text>
            <Text style={styles.totalValue}>0 FCFA</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total TTC:</Text>
            <Text style={styles.totalValue}>
              {(delivery.costs?.sellingPrice || 0).toLocaleString()} FCFA
            </Text>
          </View>
        </View>

        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Informations de paiement</Text>
          <Text>Conditions de paiement: Paiement à la livraison</Text>
          <Text>Validité de l'offre: 15 jours</Text>
        </View>

        <View style={styles.signatureSection}>
          <View>
            <View style={styles.signatureBox} />
            <Text style={styles.signatureLabel}>Signature et cachet</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
        </Text>
      </Page>
    </Document>
  );
}