import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { StockGroup, StockEntry } from '../../types/stock';
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
  stocksTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableHeaderCell: {
    fontWeight: '700',
    fontSize: 10,
    color: '#4b5563',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderBottomStyle: 'solid',
    paddingVertical: 5,
  },
  tableCell: {
    fontSize: 10,
    color: '#374151',
  },
  stockNumberCell: {
    width: '25%',
  },
  producerCell: {
    width: '35%',
  },
  quantityCell: {
    width: '20%',
    textAlign: 'right',
  },
  bagsCell: {
    width: '20%',
    textAlign: 'right',
  },
  note: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#6b7280',
    marginTop: 10,
  },
});

interface StockGroupPDFProps {
  group: StockGroup;
  stocks: StockEntry[];
  producerNames: Record<string, string>;
  warehouseNames: Record<string, string>;
}

export default function StockGroupPDF({ 
  group, 
  stocks, 
  producerNames,
  warehouseNames
}: StockGroupPDFProps) {
  // Get unique producer names
  const producers = [...new Set(group.producerIds.map(id => producerNames[id] || 'Producteur inconnu'))];
  
  // Get warehouse names
  const warehouses = group.warehouseIds.map(id => warehouseNames[id] || 'Magasin inconnu');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>FICHE DE LOT COMBINÉ</Text>
          <Text style={styles.subtitle}>N° {group.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date de création:</Text>
            <Text style={styles.value}>{format(group.createdAt, 'dd MMMM yyyy', { locale: fr })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre de stocks:</Text>
            <Text style={styles.value}>{group.stockIds.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quantité totale:</Text>
            <Text style={styles.value}>{group.totalQuantity.toFixed(2)} tonnes</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre de sacs:</Text>
            <Text style={styles.value}>{group.totalBags}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Producteurs et magasins</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Producteurs:</Text>
            <Text style={styles.value}>{producers.join(', ')}</Text>
          </View>
          {warehouses.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Magasins:</Text>
              <Text style={styles.value}>{warehouses.join(', ')}</Text>
            </View>
          )}
        </View>

        {group.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{group.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stocks inclus</Text>
          
          <View style={styles.stocksTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.stockNumberCell]}>N° Stock</Text>
              <Text style={[styles.tableHeaderCell, styles.producerCell]}>Producteur</Text>
              <Text style={[styles.tableHeaderCell, styles.quantityCell]}>Quantité</Text>
              <Text style={[styles.tableHeaderCell, styles.bagsCell]}>Sacs</Text>
            </View>
            
            {stocks.map((stock, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.stockNumberCell]}>{stock.stockNumber}</Text>
                <Text style={[styles.tableCell, styles.producerCell]}>{producerNames[stock.producerId] || 'Producteur inconnu'}</Text>
                <Text style={[styles.tableCell, styles.quantityCell]}>{stock.quantity.toFixed(2)} tonnes</Text>
                <Text style={[styles.tableCell, styles.bagsCell]}>{stock.bagCount || 0}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.note}>
            Note: Ce lot est un regroupement visuel uniquement. Les stocks individuels restent inchangés
            et disponibles pour toutes les opérations habituelles.
          </Text>
        </View>

        <Text style={styles.footer}>
          Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
        </Text>
      </Page>
    </Document>
  );
}