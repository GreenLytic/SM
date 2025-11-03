import React, { useState } from 'react';
import { StockEntry } from '../../types/stock';
import { Warehouse } from '../../types/warehouse';
import { Package, Building2, AlertTriangle, Download, FileText, ArrowUp, ArrowDown, ArrowUpDown, Layers } from 'lucide-react';
import { useStockMonitoring } from '../../hooks/useStockMonitoring'; 
import { PDFDownloadLink } from '@react-pdf/renderer';
import StockPDF from '../StockPDF';
import StockLabelPDF from '../StockLabelPDF';
import { toast } from 'react-hot-toast';

interface StockTableProps {
  stocks: StockEntry[];
  producerNames: Record<string, string>;
  warehouses: Warehouse[];
  onAssignWarehouse: (stock: StockEntry) => void;
  onQualityAssessment: (stock: StockEntry) => void;
  onSort: (key: string) => void;
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
  selectionMode?: boolean;
  selectedStocks?: StockEntry[];
  onToggleSelection?: (stock: StockEntry) => void;
}

export default function StockTable({ 
  stocks, 
  producerNames,
  warehouses,
  onAssignWarehouse, 
  onQualityAssessment,
  onSort,
  sortConfig,
  selectionMode = false,
  selectedStocks = [],
  onToggleSelection
}: StockTableProps) {
  // Start monitoring stocks with high humidity
  useStockMonitoring(stocks, 5.9309666, -4.2143906); // Abidjan coordinates

  // State for managing single PDF download
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<{[key: string]: boolean}>({});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning-light text-warning-dark';
      case 'partial': return 'bg-info-light text-info-dark';
      case 'completed': return 'bg-success-light text-success-dark';
      case 'partially_delivered': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-gray-100 text-gray-700';
      case 'partially_delivered': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'partial': return 'Partiellement payé';
      case 'completed': return 'Complété';
      case 'partially_delivered': return 'Partiellement livré';
      case 'delivered': return 'Livré';
      case 'partially_delivered': return 'Partiellement livré';
      case 'delivered': return 'Livré';
      default: return status;
    }
  };

  const getGradeColor = (quality: string) => {
    switch (quality) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getHumidityWarning = (humidity: number) => {
    if (humidity >= 8) {
      return (
        <div className="flex items-center gap-1 text-amber-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs">Humidité élevée</span>
        </div>
      );
    }
    return null;
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Non assigné';
  };

  const getSortIcon = (key: string) => {
    if (sortConfig && sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  if (stocks.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Aucun stock disponible</p>
      </div>
    );
  }

  // Group stocks by warehouse assignment
  const unassignedStocks = stocks.filter(stock => !stock.warehouseId);

  return (
    <div className="space-y-6">
      {/* Unassigned Stocks Section */}
      {unassignedStocks.length > 0 && (
        <div className="bg-warning-light rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-warning-dark" />
            <h3 className="text-lg font-medium text-warning-dark">
              Stocks à assigner ({unassignedStocks.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unassignedStocks.map((stock) => (
              <div key={stock.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {selectionMode && (
                      <input
                        type="checkbox"
                        checked={selectedStocks?.some(s => s.id === stock.id) || false}
                        onChange={() => onToggleSelection && !stock.isGrouped && onToggleSelection(stock)}
                        disabled={stock.isGrouped}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">Stock #{stock.stockNumber}</p>
                      <p className="text-sm text-gray-500">{stock.date?.toLocaleDateString()}</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {producerNames[stock.producerId] || 'Chargement...'}
                      </p>
                    </div>
                  </div>
                  {stock.calculatedGrade ? (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(stock.quality)}`}>
                      {stock.calculatedGrade}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Non évalué
                    </span>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quantité:</span>
                    <span className="text-sm font-medium">{stock.quantity?.toFixed(2)} tonnes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nombre de sacs:</span>
                    <span className="text-sm font-medium">{stock.bagCount || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Humidité:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stock.humidity}%</span>
                      {getHumidityWarning(stock.humidity)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAssignWarehouse(stock)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Assigner</span>
                  </button>
                  <div className="flex-1 flex gap-2">
                    <PDFDownloadLink
                      document={<StockPDF stock={stock} producerName={producerNames[stock.producerId] || 'Producteur'} />}
                      fileName={`stock_${stock.stockNumber}.pdf`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {({ loading }) => (
                        <>
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span>PDF</span>
                        </>
                      )}
                    </PDFDownloadLink>
                    <PDFDownloadLink
                      document={<StockLabelPDF stock={stock} />}
                      fileName={`etiquette_${stock.stockNumber}.pdf`}
                      className="flex items-center justify-center px-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      {({ loading }) => (
                        <span className="flex items-center gap-1">
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                          <span className="text-xs">Étiquette</span>
                        </span>
                      )}
                    </PDFDownloadLink>
                  </div>
                </div>
                {!stock.calculatedGrade && (
                  <button
                    onClick={() => onQualityAssessment(stock)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Évaluer la qualité</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Stocks Table */}
      {stocks.filter(stock => stock.warehouseId).length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun stock disponible</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {selectionMode && (
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Sélection
                    </span>
                  </th>
                )}
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => onSort('date')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Date
                    {getSortIcon('date')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => onSort('stockNumber')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    N° Stock
                    {getSortIcon('stockNumber')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producteur
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => onSort('quantity')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Quantité actuelle
                    {getSortIcon('quantity')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sacs actuels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantité initiale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sacs total
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => onSort('calculatedGrade')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Grade
                    {getSortIcon('calculatedGrade')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => onSort('humidity')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Humidité
                    {getSortIcon('humidity')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Magasin
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => onSort('pricePerTon')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Prix/Tonne
                    {getSortIcon('pricePerTon')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => onSort('totalCost')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Montant total
                    {getSortIcon('totalCost')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => onSort('paymentStatus')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Statut
                    {getSortIcon('paymentStatus')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Lot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stocks.filter(stock => stock.warehouseId).map((stock) => (
                <tr key={stock.id} className={`hover:bg-gray-50 ${stock.isGrouped ? 'bg-blue-50' : ''}`}>
                  {selectionMode ? (
                    <td className="px-6 py-4">
                      <input
                         type="checkbox"
                         checked={selectedStocks?.some(s => s.id === stock.id) || false}
                         onChange={() => onToggleSelection && !stock.isGrouped && onToggleSelection(stock)}
                         disabled={stock.isGrouped}
                         className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>
                  ) : null}
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {stock.date?.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      {stock.stockNumber}
                      {stock.isGrouped && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          En lot
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {producerNames[stock.producerId] || 'Chargement...'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {stock.quantity?.toFixed(2)} tonnes
                    {stock.status === 'partially_delivered' && stock.deliveredQuantity && (
                      <span className="text-xs text-gray-500 ml-1">
                        (Livré: {stock.deliveredQuantity.toFixed(2)} tonnes)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {stock.bagCount || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {stock.originalQuantity?.toFixed(2) || stock.quantity?.toFixed(2)} tonnes
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {stock.originalBagCount || stock.bagCount || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {stock.calculatedGrade ? (
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getGradeColor(stock.quality)}`}>
                        {stock.calculatedGrade}
                      </span>
                    ) : (
                      <button
                        onClick={() => onQualityAssessment(stock)}
                        className="flex items-center gap-1 text-xs text-amber-600 font-medium hover:text-amber-800"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Non évalué
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{stock.humidity}%</span>
                      {getHumidityWarning(stock.humidity)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getWarehouseName(stock.warehouseId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {stock.pricePerTon ? stock.pricePerTon.toLocaleString() : '0'} FCFA
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {stock.totalCost ? stock.totalCost.toLocaleString() : '0'} FCFA
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stock.paymentStatus)}`}>
                      {getStatusText(stock.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {stock.isGrouped && <Layers className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                      <span className="text-xs font-medium text-blue-600 whitespace-nowrap">{stock.lotId || stock.groupId || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <div className="flex gap-1">
                        <PDFDownloadLink
                          document={<StockPDF stock={stock} producerName={producerNames[stock.producerId] || 'Producteur'} />}
                          fileName={`stock_${stock.stockNumber}.pdf`}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                        >
                          {({ loading }) => (
                            <>
                              {loading ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              <span>PDF</span>
                            </>
                          )}
                        </PDFDownloadLink>
                        <PDFDownloadLink
                          document={<StockLabelPDF stock={stock} />}
                          fileName={`etiquette_${stock.stockNumber}.pdf`}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-800 ml-2 px-2 py-1 border border-purple-200 rounded-md hover:bg-purple-50 whitespace-nowrap"
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
                      {!stock.calculatedGrade && (
                        <button
                          onClick={() => onQualityAssessment(stock)}
                          className="flex items-center gap-1 text-amber-600 hover:text-amber-800 px-2 py-1 border border-amber-200 rounded-md hover:bg-amber-50"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Évaluer</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}