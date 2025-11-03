import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { CollectionRoute } from '../../types/route';
import { Producer } from '../../types/producer';
import { CooperativeInfo } from '../../types/cooperative';
import { format } from 'date-fns'; 
import { fr } from 'date-fns/locale'; 
import { RouteCalculator } from '../../services/routing/RouteCalculator';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10,
    borderBottomColor: '#2F5E1E',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cooperativeInfo: {
    flex: 1,
  },
  cooperativeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2F5E1E',
  },
  cooperativeLocation: {
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#444',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f3f4f6',
    padding: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#2F5E1E',
    borderLeftStyle: 'solid',
  },
  routeInfo: {
    marginBottom: 15,
  },
  routeInfoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  routeInfoLabel: {
    width: '30%',
    fontWeight: 'bold',
    color: '#444',
  },
  routeInfoValue: {
    width: '70%',
    color: '#333',
  },
  participantsSection: {
    marginBottom: 15,
  },
  participantRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  participantLabel: {
    width: '30%',
    fontWeight: 'bold',
    color: '#444',
  },
  participantValue: {
    width: '70%',
    color: '#333',
  },
  collectionTable: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#f3f4f6',
    padding: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 5,
    minHeight: 40,
  },
  checkboxCell: {
    width: '5%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 15,
    marginTop: 3,
  },
  producerCell: {
    width: '25%',
  },
  quantityCell: {
    width: '15%',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginRight: 5,
  },
  weightCell: {
    width: '15%',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginRight: 5,
  },
  timeCell: {
    width: '15%',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginRight: 5,
  },
  phoneCell: {
    width: '15%',
  },
  signatureCell: {
    width: '10%',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fuelSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  fuelRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  fuelLabel: {
    width: '50%',
    fontWeight: 'bold',
    color: '#444',
  },
  fuelValue: {
    width: '50%',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    height: 18,
  },
  notesSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  notesBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 100,
    marginTop: 5,
  },
  expensesSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  expenseRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  expenseLabel: {
    width: '30%',
    fontWeight: 'bold',
    color: '#444',
  },
  expenseValue: {
    width: '70%',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    height: 18,
  },
  paymentSection: {
    marginTop: 15,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  paymentLabel: {
    width: '50%',
    color: '#444',
  },
  paymentCheckbox: {
    width: 15,
    height: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 5,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountField: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flex: 1,
    marginLeft: 5,
    height: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  map: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    border: 1,
    borderColor: '#E5E7EB',
  },
  producerForm: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  producerFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 5,
  },
  producerFormName: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  producerFormPhone: {
    fontSize: 10,
    color: '#666',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  formLabel: {
    width: '40%',
    fontSize: 10,
    color: '#555',
  },
  formField: {
    width: '60%',
    height: 18,
    borderBottomWidth: 1,
    borderBottomStyle: 'dotted',
    borderBottomColor: '#999',
  },
  paymentOptions: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  paymentOptionLabel: {
    fontSize: 9,
    marginLeft: 3,
  },
  signatureArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  signatureBox: {
    width: '45%',
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signatureLabel: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 3,
    color: '#666',
  },
  pageBreak: {
    height: 1,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
    breakAfter: 'page',
  },
});

interface RoutePlanningPDFProps {
  route: CollectionRoute;
  producers: Producer[];
  cooperative: CooperativeInfo;
  distance: number;
  duration: number;
}

export default function RoutePlanningPDF({
  route,
  producers = [],
  cooperative = { name: 'SMARTCOOP', location: 'Abidjan', coordinates: [5.9309666, -4.2143906], certifications: [] },
  distance,
  duration
}: RoutePlanningPDFProps) {
  // Define today variable for consistent date formatting
  const today = new Date();
  
  // Get producers for this route
  const routeProducers = producers.filter(p => 
    route.stops.some(stop => stop.producerId === p.id)
  );

  // Calculate estimated fuel consumption (8L/100km is an average consumption)
  const fuelConsumption = (distance * 8) / 100;

  // Format time from minutes to hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerContent}>
            <View style={styles.cooperativeInfo}>
              <Text style={styles.cooperativeName}>{cooperative.name}</Text>
              <Text style={styles.cooperativeLocation}>{cooperative.location}</Text>
            </View>
          </View>
          <Text style={styles.title}>PLAN DE TOURNÉE DE RAMASSAGE</Text>
          <Text style={styles.subtitle}>Tournée: {route.name} - {format(route.date, 'dd MMMM yyyy', { locale: fr })}</Text>
        </View>

        {/* 1. Informations générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Informations générales</Text>
          
          <View style={styles.routeInfo}>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Date de la tournée:</Text>
              <Text style={styles.routeInfoValue}>{format(route.date, 'dd MMMM yyyy', { locale: fr })}</Text>
            </View>
            
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Heure de départ:</Text>
              <Text style={styles.routeInfoValue}>{route.startTime}</Text>
            </View>
            
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Chauffeur:</Text>
              <Text style={styles.routeInfoValue}>{route.driver}</Text>
            </View>
            
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Accompagnants:</Text>
              <Text style={styles.routeInfoValue}>{route.participants?.join(', ') || 'Aucun'}</Text>
            </View>
            
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Villages visités:</Text>
              <Text style={styles.routeInfoValue}>{route.stops.map(stop => stop.location).join(', ')}</Text>
            </View>
            
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Nombre d'arrêts:</Text>
              <Text style={styles.routeInfoValue}>{route.stops.length}</Text>
            </View>
            
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Distance estimée:</Text>
              <Text style={styles.routeInfoValue}>{Math.round(distance)} km</Text>
            </View>
            
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Durée estimée:</Text>
              <Text style={styles.routeInfoValue}>{formatDuration(duration)}</Text>
            </View>
            
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Consommation carburant estimée:</Text>
              <Text style={styles.routeInfoValue}>{fuelConsumption.toFixed(2)} litres</Text>
            </View>
          </View>
        </View>

        {/* 2. Checklist de préparation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Checklist de préparation</Text>
          
          <View style={styles.collectionTable}>
            <View style={styles.tableRow}>
              <View style={styles.checkboxCell} />
              <Text style={styles.producerCell}>Vérification du véhicule (carburant, huile, pneus)</Text>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.checkboxCell} />
              <Text style={styles.producerCell}>Équipement de pesage calibré</Text>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.checkboxCell} />
              <Text style={styles.producerCell}>Sacs de rechange</Text>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.checkboxCell} />
              <Text style={styles.producerCell}>Appareil de mesure d'humidité</Text>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.checkboxCell} />
              <Text style={styles.producerCell}>Documents administratifs (permis, assurance)</Text>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.checkboxCell} />
              <Text style={styles.producerCell}>Téléphone chargé et crédit téléphonique</Text>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.checkboxCell} />
              <Text style={styles.producerCell}>Fonds pour paiements et dépenses</Text>
            </View>
          </View>
        </View>

        {/* 3. Itinéraire détaillé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Itinéraire détaillé</Text>
          
          <View style={styles.collectionTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.producerCell}>Étape</Text>
              <Text style={styles.producerCell}>Lieu</Text>
              <Text style={styles.producerCell}>Producteur</Text>
              <Text style={styles.timeCell}>Heure prévue</Text>
              <Text style={styles.phoneCell}>Contact</Text>
            </View>
            
            {/* Point de départ */}
            <View style={styles.tableRow}>
              <Text style={styles.producerCell}>Départ</Text>
              <Text style={styles.producerCell}>
                {route.useCooperativeAsStart !== false ? cooperative.location : route.startLocation || 'Départ'}
              </Text>
              <Text style={styles.producerCell}>-</Text>
              <Text style={styles.timeCell}>{route.startTime}</Text>
              <Text style={styles.phoneCell}>-</Text>
            </View>
            
            {/* Arrêts */}
            {route.stops.map((stop, index) => {
              const producer = routeProducers.find(p => p.id === stop.producerId);
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.producerCell}>Arrêt {index + 1}</Text>
                  <Text style={styles.producerCell}>{stop.location}</Text>
                  <Text style={styles.producerCell}>{producer?.fullName || 'Inconnu'}</Text>
                  <Text style={styles.timeCell}>{stop.estimatedTime || '-'}</Text>
                  <Text style={styles.phoneCell}>{producer?.phone || '-'}</Text>
                </View>
              );
            })}
            
            {/* Point d'arrivée */}
            <View style={styles.tableRow}>
              <Text style={styles.producerCell}>Arrivée</Text>
              <Text style={styles.producerCell}>
                {route.useCooperativeAsEnd !== false ? cooperative.location : route.endLocation || 'Arrivée'}
              </Text>
              <Text style={styles.producerCell}>-</Text>
              <Text style={styles.timeCell}>{route.endTime || '-'}</Text>
              <Text style={styles.phoneCell}>-</Text>
            </View>
          </View>
        </View>

        {/* Page break */}
        <View style={styles.pageBreak} />

        {/* 4. Détails des producteurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Détails des producteurs ({routeProducers.length})</Text>
          
          {routeProducers.length > 0 ? routeProducers.map((producer, index) => (
            <View key={index} style={styles.producerForm} wrap={false}>
              <View style={styles.producerFormHeader}>
                <Text style={styles.producerFormName}>{producer.fullName}</Text>
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Téléphone:</Text>
                <Text>{producer.phone}</Text>
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Adresse:</Text>
                <Text>{producer.address}</Text>
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Surface cultivée:</Text>
                <Text>{producer.cultivatedArea} ha</Text>
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Production estimée:</Text>
                <Text>{producer.estimatedProduction} tonnes</Text>
              </View>
            </View>
          )) : (
            <Text>Aucun producteur trouvé pour cette tournée.</Text>
          )}
        </View>

        {/* 5. Notes et instructions spéciales */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>5. Notes et instructions spéciales</Text>
          {route.notes ? (
            <Text>{route.notes}</Text>
          ) : (
            <View style={styles.notesBox} />
          )}
        </View>

        {/* 6. Validation */}
        <View style={styles.signatureArea}>
          <View>
            <View style={styles.signatureBox} />
            <Text style={styles.signatureLabel}>Signature du responsable</Text>
          </View>
          
          <View>
            <View style={styles.signatureBox} />
            <Text style={styles.signatureLabel}>Signature du chauffeur</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Document généré le {format(today, 'dd MMMM yyyy', { locale: fr })} - {cooperative?.name || 'SMARTCOOP'}
        </Text>
      </Page>
    </Document>
  );
}