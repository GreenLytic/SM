import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { StockGroup } from '../../types/stock';
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
  lotNumber: {
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
  note: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#6b7280',
    marginTop: 10,
    textAlign: 'center'
  },
});

interface StockGroupLabelPDFProps {
  group: StockGroup;
}

export default function StockGroupLabelPDF({ group }: StockGroupLabelPDFProps) {
  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <Text style={styles.header}>ÉTIQUETTE LOT</Text>
        <Text style={styles.lotNumber}>{group.name}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{format(group.createdAt, 'dd MMMM yyyy', { locale: fr })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quantité:</Text>
            <Text style={styles.value}>{group.totalQuantity.toFixed(2)} tonnes</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre de sacs:</Text>
            <Text style={styles.value}>{group.totalBags}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre de stocks:</Text>
            <Text style={styles.value}>{group.stockIds.length}</Text>
          </View>
          
          <Text style={styles.note}>
            Lot combiné à usage visuel uniquement
          </Text>
        </View>
        
        <Text style={styles.footer}>
          Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
        </Text>
      </Page>
    </Document>
  );
}