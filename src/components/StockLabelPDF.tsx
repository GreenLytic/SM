import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { StockEntry } from '../types/stock';
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
  stockNumber: {
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
  gradeBadge: {
    alignSelf: 'flex-start',
    padding: '8px 20px',
    borderRadius: 20,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
    width: '60%',
    alignSelf: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  gradeI: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
  },
  gradeII: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
  },
  rejected: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
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
    width: 80,
    height: 80,
    marginVertical: 10,
    alignSelf: 'center'
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 10
  },
});

interface StockLabelPDFProps {
  stock: StockEntry;
}

const StockLabelPDF: React.FC<StockLabelPDFProps> = ({ stock }) => {
  const getGradeStyle = () => {
    switch (stock.quality) {
      case 'A': return styles.gradeI;
      case 'B': return styles.gradeII;
      case 'C': return styles.rejected;
      default: return styles.gradeI;
    }
  };

  const getGradeText = () => {
    switch (stock.quality) {
      case 'A': return 'Grade I';
      case 'B': return 'Grade II';
      case 'C': return 'Refusé';
      default: return 'Non évalué';
    }
  };

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <Text style={styles.header}>ÉTIQUETTE STOCK</Text>
        <Text style={styles.stockNumber}>{stock.stockNumber}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS</Text>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{format(stock.date, 'dd MMMM yyyy', { locale: fr })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quantité:</Text>
            <Text style={styles.value}>{stock.quantity.toFixed(2)} tonnes</Text>
          </View>
          {stock.bagCount !== undefined && stock.bagCount > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Nombre de sacs:</Text>
              <Text style={styles.value}>{stock.bagCount}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Humidité:</Text>
            <Text style={styles.value}>{stock.humidity}%</Text>
          </View>
          
          <View style={{ alignItems: 'center', marginTop: 15 }}>
            <Text style={[styles.gradeBadge, getGradeStyle()]}>
              {getGradeText()}
            </Text>
          </View>
          
          {/* QR Code placeholder - in a real app, you would generate a QR code here */}
          {/* <Image src={qrCodeUrl} style={styles.qrCode} /> */}
        </View>
        
        <Text style={styles.footer}>
          Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })} • SMARTCOOP
        </Text>
      </Page>
    </Document>
  );
};

export default StockLabelPDF;