import React from 'react';
import { StockGroup, StockEntry } from '../../types/stock';
import { Layers, Archive, FileText, Package } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import StockGroupPDF from './StockGroupPDF';
import StockGroupLabelPDF from './StockGroupLabelPDF';

interface StockGroupDetailsProps {
  group: StockGroup;
  stocks: StockEntry[];
  producerNames: Record<string, string>;
  warehouseNames: Record<string, string>;
  onClose: () => void;
  onDisassociate?: () => void;
  isArchived?: boolean;
}

export default function StockGroupDetails({
  group,
  stocks,
  producerNames,
  warehouseNames,
  onClose,
  onDisassociate,
  isArchived = false
}: StockGroupDetailsProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Lot #{group.name}</h2>
          <p className="text-sm text-gray-500">
            {isArchived 
              ? `Dissocié le ${group.archivedAt?.toLocaleDateString()}` 
              : `Créé le ${group.createdAt.toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <PDFDownloadLink
            document={
              <StockGroupPDF 
                group={group} 
                stocks={stocks} 
                producerNames={producerNames}
                warehouseNames={warehouseNames}
              />
            }
            fileName={`lot_${group.name.replace(/\s+/g, '_').toLowerCase()}.pdf`}
            className="flex items-center gap-1 text-green-600 hover:text-green-800 px-2 py-1 border border-green-200 rounded-md hover:bg-green-50"
          >
            {({ loading }) => (
              <>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>PDF</span>
              </>
            )}
          </PDFDownloadLink>
          
          <PDFDownloadLink
            document={<StockGroupLabelPDF group={group} />}
            fileName={`etiquette_lot_${group.name.replace(/\s+/g, '_').toLowerCase()}.pdf`}
            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 px-2 py-1 border border-purple-200 rounded-md hover:bg-purple-50"
          >
            {({ loading }) => (
              <>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Package className="w-4 h-4" />
                )}
                <span>Étiquette</span>
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Quantité totale</p>
          <div>
            <p className="text-xl font-semibold">{(group.remainingQuantity || group.totalQuantity).toFixed(2)} tonnes</p>
            {group.deliveredQuantity && group.deliveredQuantity > 0 && (
              <p className="text-sm text-gray-500">
                Total initial: {group.totalQuantity.toFixed(2)} tonnes
                <br />
                Livré: {group.deliveredQuantity.toFixed(2)} tonnes
              </p>
            )}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Nombre de sacs</p>
          <div>
            <p className="text-xl font-semibold">{group.remainingBags || group.totalBags}</p>
            {group.deliveredBags && group.deliveredBags > 0 && (
              <p className="text-sm text-gray-500">
                Total initial: {group.totalBags}
                <br />
                Livré: {group.deliveredBags}
              </p>
            )}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Nombre de stocks</p>
          <p className="text-xl font-semibold">{group.stockIds.length}</p>
        </div>
      </div>

      {group.status && group.status !== 'available' && (
        <div className={`p-4 rounded-lg border ${
          group.status === 'delivered' ? 'bg-gray-50 border-gray-200' :
          group.status === 'partially_delivered' ? 'bg-orange-50 border-orange-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <h3 className="font-medium text-gray-900 mb-2">Statut de livraison</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Statut:</span>
              <p className="font-medium">
                {group.status === 'delivered' ? 'Entièrement livré' :
                 group.status === 'partially_delivered' ? 'Partiellement livré' :
                 'Disponible'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Verrouillé:</span>
              <p className="font-medium">{group.locked ? 'Oui' : 'Non'}</p>
            </div>
          </div>
        </div>
      )}

      {group.notes && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
          <p className="text-sm text-gray-600">{group.notes}</p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Stocks inclus</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {stocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun stock trouvé
            </div>
          ) : (
            stocks.map((stock) => (
              <div key={stock.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Stock #{stock.stockNumber}</p>
                    <p className="text-sm text-gray-500">{producerNames[stock.producerId]}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{stock.quantity.toFixed(2)} tonnes</p>
                    <p className="text-sm text-gray-500">{stock.bagCount || 0} sacs</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Qualité:</span>
                    <span className="font-medium">
                      {stock.calculatedGrade || (stock.quality ? `Qualité ${stock.quality}` : 'Non évaluée')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Magasin:</span>
                    <span className="font-medium">
                      {stock.warehouseId ? warehouseNames[stock.warehouseId] || 'Inconnu' : 'Non assigné'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {!isArchived && onDisassociate && !group.locked && (
          <button
            onClick={onDisassociate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
          >
            <Archive className="w-4 h-4" />
            <span>Dissocier le lot</span>
          </button>
        )}
        
        {!isArchived && group.locked && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-md">
            <Archive className="w-4 h-4" />
            <span>Lot verrouillé (utilisé en livraison)</span>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}