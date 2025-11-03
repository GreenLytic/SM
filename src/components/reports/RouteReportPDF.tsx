import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { CollectionRoute } from '../../types/route';
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
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    minHeight: 25,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: '700',
  },
  tableCell: {
    flex: 1,
    padding: 5,
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
  logisticsSection: {
    marginTop: 10,
  },
  notesSection: {
    marginTop: 10,
  },
  producerSection: {
    marginTop: 10,
    marginBottom: 5,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 5,
  },
  producerHeader: {
    fontWeight: '700',
    marginBottom: 3,
  },
  producerDetail: {
    fontSize: 10,
    marginBottom: 2,
  },
  paymentSection: {
    flexDirection: 'row',
    marginTop: 3,
  },
  paymentMethod: {
    fontSize: 10,
    marginRight: 10,
  },
  signatureSection: {
    flexDirection: 'row',
    marginTop: 5,
    justifyContent: 'space-between',
  },
  signatureLine: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 15,
    paddingTop: 2,
    fontSize: 9,
    textAlign: 'center',
  },
  expensesTable: {
    marginTop: 5,
  },
  expenseRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 3,
  },
  expenseLabel: {
    width: '60%',
    fontSize: 10,
  },
  expenseValue: {
    width: '40%',
    fontSize: 10,
  },
});

interface RouteReportPDFProps {
  route: CollectionRoute; 
}

export default function RouteReportPDF({ route }: RouteReportPDFProps) {
  // Définir la date du jour pour le formatage cohérent des dates
  const today = format(new Date(), 'dd MMMM yyyy', { locale: fr });

  // Calculate total distance (mock data since we don't have real distances)
  const totalDistance = Math.round(Math.random() * 50 + 50); // 50-100km
  const fuelUsed = Math.round(totalDistance * 0.08 * 10) / 10; // 8L/100km

  // Calculate total collected weight
  const totalCollected = route.stops
    .filter(stop => stop.status === 'completed')
    .reduce((sum, stop) => sum + (stop.estimatedQuantity || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Rapport de Tournée de Collecte</Text>
          <Text>Tournée: {route.name}</Text>
        </View>

        {/* 1. Informations générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Informations générales</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {format(route.date, 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Heure de départ:</Text>
            <Text style={styles.value}>{route.startTime}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Chauffeur:</Text>
            <Text style={styles.value}>{route.driver}</Text>
          </View>
          {route.participants && route.participants.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Accompagnants:</Text>
              <Text style={styles.value}>{route.participants.join(', ')}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Zones visitées:</Text>
            <Text style={styles.value}>
              {route.stops.map(stop => stop.location).join(', ')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de fin:</Text>
            <Text style={styles.value}>
              {format(route.completedAt || new Date(), 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
        </View>

        {/* 2. Détails par producteur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Détails par producteur</Text>
          
          {route.stops.filter(stop => stop.status === 'completed').map((stop, index) => (
            <View key={index} style={styles.producerSection}>
              <Text style={styles.producerHeader}>Producteur {index + 1}: {stop.location}</Text>
              <View style={styles.producerDetail}>
                <Text>Quantité: {stop.estimatedQuantity} tonnes</Text>
                <Text>Qualité: {stop.quality}</Text>
                <Text>Humidité: {stop.humidity}%</Text>
              </View>
              
              <View style={styles.paymentSection}>
                <Text style={styles.paymentMethod}>□ Virement</Text>
                <Text style={styles.paymentMethod}>□ Espèces</Text>
                <Text style={styles.paymentMethod}>□ Mobile Money</Text>
              </View>
              
              <View style={styles.signatureSection}>
                <Text style={styles.signatureLine}>Signature du producteur</Text>
                <Text style={styles.signatureLine}>Signature du collecteur</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 3. Données logistiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Données logistiques</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Distance totale parcourue:</Text>
            <Text style={styles.value}>{totalDistance} km</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Carburant utilisé (estimé):</Text>
            <Text style={styles.value}>{fuelUsed} litres</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quantité totale collectée:</Text>
            <Text style={styles.value}>{totalCollected.toFixed(2)} tonnes</Text>
          </View>
        </View>

        {/* 4. Notes et imprévus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Notes et imprévus</Text>
          <View style={styles.notesSection}>
            <Text>{route.notes || 'Aucune note particulière'}</Text>
          </View>
          
          <Text style={{marginTop: 10, fontWeight: 'bold'}}>Dépenses supplémentaires:</Text>
          <View style={styles.expensesTable}>
            <View style={[styles.expenseRow, styles.tableHeader]}>
              <Text style={styles.expenseLabel}>Description</Text>
              <Text style={styles.expenseValue}>Montant (FCFA)</Text>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>Carburant</Text>
              <Text style={styles.expenseValue}></Text>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>Péages</Text>
              <Text style={styles.expenseValue}></Text>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>Réparations</Text>
              <Text style={styles.expenseValue}></Text>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>Autres</Text>
              <Text style={styles.expenseValue}></Text>
            </View>
          </View>
        </View>

        {/* 5. Validation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Validation</Text>
          <View style={{marginTop: 20, flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={styles.signatureLine}>Signature du responsable</Text>
            <Text style={styles.signatureLine}>Date</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Document généré le {today}
        </Text>
      </Page>
    </Document>
  );
}