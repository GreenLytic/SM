import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CollectionRoute } from '../../types/route';
import { Producer } from '../../types/producer'; 
import { CooperativeInfo } from '../../types/cooperative'; 

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
    fontWeight: '700',
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
  routeName: {
    fontSize: 12,
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
  },
  producerSection: {
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
    fontSize: 12,
  },
  producerFormPhone: {
    fontSize: 10,
    color: '#666',
  },
  producerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  producerSectionName: {
    fontWeight: '700',
    fontSize: 12,
    alignItems: 'center',
  },
  formLabel: {
    width: '40%',
    fontSize: 10,
    color: '#444',
  },
  producerSectionPhone: {
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

interface RouteCollectionSheetProps {
  route: CollectionRoute;
  producers: Producer[];
  cooperative: CooperativeInfo;
  distance: number;
  duration: number;
  mapImageUrl?: string;
}

export default function RouteCollectionSheet({
  route,
  producers = [],
  cooperative = { name: 'SMARTCOOP', location: 'Abidjan', coordinates: [5.9309666, -4.2143906] },
  distance,
  duration,
  mapImageUrl
}: RouteCollectionSheetProps) {
  // Calculate estimated fuel consumption (8L/100km is an average consumption)
  const fuelConsumption = (distance * 8) / 100;
  
  // Get producers for this route
  const routeProducers = producers.filter(p => 
    route.stops.some(stop => stop.producerId === p.id)
  );

  // Déterminer les points de départ et d'arrivée
  const startLocation = route.useCooperativeAsStart !== false ? 
    cooperative.location : route.startLocation || cooperative.location;
  
  const endLocation = route.useCooperativeAsEnd !== false ? 
    cooperative.location : route.endLocation || cooperative.location;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerContent}>
            <View style={styles.cooperativeInfo}>
              <Text style={styles.cooperativeName}>{cooperative?.name || 'SMARTCOOP'}</Text>
              <Text style={styles.cooperativeLocation}>{cooperative?.location || 'Abidjan'}</Text>
            </View>
          </View>
          <Text style={styles.title}>FEUILLE DE ROUTE - COLLECTE</Text>
          <Text style={styles.routeName}>Tournée: {route.name}</Text>
        </View>

        {/* Route Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de la tournée</Text>
          
          <View style={styles.routeInfo}>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Date:</Text>
              <Text style={styles.routeInfoValue}>{format(route.date, 'dd MMMM yyyy', { locale: fr })}</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Heure de départ:</Text>
              <Text style={styles.routeInfoValue}>{route.startTime}</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Distance estimée:</Text>
              <Text style={styles.routeInfoValue}>{Math.round(distance)} km</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Durée estimée:</Text>
              <Text style={styles.routeInfoValue}>{Math.floor(duration / 60)}h{Math.round(duration % 60).toString().padStart(2, '0')}</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Point de départ:</Text>
              <Text style={styles.routeInfoValue}>{startLocation}</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Point d'arrivée:</Text>
              <Text style={styles.routeInfoValue}>{endLocation}</Text>
            </View>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>Intervenants</Text>
          
          <View style={styles.participantRow}>
            <Text style={styles.participantLabel}>Chauffeur:</Text>
            <Text style={styles.participantValue}>{route.driver}</Text>
          </View>
          
          {route.participants && route.participants.length > 0 && (
            <View style={styles.participantRow}>
              <Text style={styles.participantLabel}>Accompagnants:</Text>
              <Text style={styles.participantValue}>{route.participants.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Map */}
        {mapImageUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carte de l'itinéraire</Text>
            <Image src={mapImageUrl} style={styles.map} />
          </View>
        )}

        {/* Page break */}
        <View style={styles.pageBreak} />

        {/* Collection Forms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formulaires de collecte</Text>
          
          {routeProducers.map((producer, index) => (
            <View key={index} style={styles.producerForm} wrap={false}>
              <View style={styles.producerFormHeader}>
                <Text style={styles.producerFormName}>{producer.fullName}</Text>
                <Text style={styles.producerFormPhone}>Tél: {producer.phone}</Text>
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Nombre de sacs:</Text>
                <View style={styles.formField} />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Poids total (kg):</Text>
                <View style={styles.formField} />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Qualité (A/B/C):</Text>
                <View style={styles.formField} />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Humidité (%):</Text>
                <View style={styles.formField} />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Heure de collecte:</Text>
                <View style={styles.formField} />
              </View>
              
              <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 8, marginBottom: 4 }}>Mode de paiement:</Text>
              <View style={styles.paymentOptions}>
                <View style={styles.paymentOption}>
                  <View style={styles.paymentCheckbox} />
                  <Text style={styles.paymentOptionLabel}>Espèces</Text>
                </View>
                <View style={styles.paymentOption}>
                  <View style={styles.paymentCheckbox} />
                  <Text style={styles.paymentOptionLabel}>Virement</Text>
                </View>
                <View style={styles.paymentOption}>
                  <View style={styles.paymentCheckbox} />
                  <Text style={styles.paymentOptionLabel}>Mobile Money</Text>
                </View>
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Numéro/Compte:</Text>
                <View style={styles.formField} />
              </View>

              <View style={styles.signatureArea}>
                <View>
                  <View style={styles.signatureBox} />
                  <Text style={styles.signatureLabel}>Signature producteur</Text>
                </View>
                <View>
                  <View style={styles.signatureBox} />
                  <Text style={styles.signatureLabel}>Signature chauffeur</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Page break */}
        <View style={styles.pageBreak} />

        {/* Fuel Estimation */}
        <View style={styles.fuelSection}>
          <Text style={styles.sectionTitle}>Carburant</Text>
          
          <View style={styles.fuelRow}>
            <Text style={styles.fuelLabel}>Consommation estimée:</Text>
            <Text style={styles.fuelValue}>{fuelConsumption.toFixed(2)} litres</Text>
          </View>
          <View style={styles.fuelRow}>
            <Text style={styles.fuelLabel}>Carburant au départ:</Text>
            <Text style={styles.fuelValue}></Text>
          </View>
          <View style={styles.fuelRow}>
            <Text style={styles.fuelLabel}>Carburant à l'arrivée:</Text>
            <Text style={styles.fuelValue}></Text>
          </View>
        </View>

        {/* Notes and Unexpected Events */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes et imprévus</Text>
          <View style={styles.notesBox}></View>
        </View>

        {/* Expenses */}
        <View style={styles.expensesSection}>
          <Text style={styles.sectionTitle}>Dépenses annexes</Text>
          
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Carburant:</Text>
            <Text style={styles.expenseValue}></Text>
          </View>
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Péages:</Text>
            <Text style={styles.expenseValue}></Text>
          </View>
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Réparations:</Text>
            <Text style={styles.expenseValue}></Text>
          </View>
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Autres:</Text>
            <Text style={styles.expenseValue}></Text>
          </View>
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Total:</Text>
            <Text style={styles.expenseValue}></Text>
          </View>
        </View>

        {/* Validation */}
        <View style={styles.signatureArea}>
          <View>
            <View style={[styles.signatureBox, { height: 60 }]} />
            <Text style={styles.signatureLabel}>Signature du chauffeur</Text>
          </View>
          <View>
            <View style={[styles.signatureBox, { height: 60 }]} />
            <Text style={styles.signatureLabel}>Signature du responsable</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Document généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })} - {cooperative?.name || 'SMARTCOOP'}
        </Text>
      </Page>
    </Document>
  );
}