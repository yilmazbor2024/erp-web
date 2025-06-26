import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import warehouseTransferApi, { 
  WarehouseTransferResponse,
  WarehouseTransferItemResponse
} from '../../services/warehouseTransferApi';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { useSnackbar } from 'notistack';

const WarehouseTransferDetailPage: React.FC = () => {
  const { transferNumber } = useParams<{ transferNumber: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // State tanımlamaları
  const [transfer, setTransfer] = useState<WarehouseTransferResponse | null>(null);
  const [transferItems, setTransferItems] = useState<WarehouseTransferItemResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'approve' | 'cancel' | 'lock' | 'unlock' | null>(null);
  
  // Sayfa yüklendiğinde veriyi getir
  useEffect(() => {
    if (transferNumber) {
      fetchTransferData();
    }
  }, [transferNumber]);
  
  // Sevk detaylarını getiren fonksiyon
  const fetchTransferData = async () => {
    if (!transferNumber) return;
    
    setLoading(true);
    try {
      // Ana sevk bilgilerini getir
      const data = await warehouseTransferApi.getWarehouseTransferByNumber(transferNumber);
      if (data) {
        setTransfer(data);
        
        // Sevk satır detaylarını getir
        const items = await warehouseTransferApi.getWarehouseTransferItems(transferNumber);
        setTransferItems(items);
      } else {
        enqueueSnackbar('Sevk kaydı bulunamadı', { variant: 'error' });
        navigate('/inventory/warehouse-transfers');
      }
    } catch (error) {
      console.error('Error fetching transfer data:', error);
      enqueueSnackbar('Sevk detayları yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // İşlem onay dialogunu açma fonksiyonu
  const openConfirmDialog = (action: 'approve' | 'cancel' | 'lock' | 'unlock') => {
    setActionType(action);
    setConfirmDialogOpen(true);
  };
  
  // Onaylama, iptal etme, kilitleme ve kilit açma işlemleri
  const handleAction = async () => {
    if (!transferNumber || !actionType) return;
    
    setLoading(true);
    try {
      let success = false;
      let message = '';
      
      switch (actionType) {
        case 'approve':
          success = await warehouseTransferApi.approveWarehouseTransfer(transferNumber);
          message = 'Sevk başarıyla onaylandı';
          break;
        case 'cancel':
          success = await warehouseTransferApi.cancelWarehouseTransfer(transferNumber);
          message = 'Sevk başarıyla iptal edildi';
          break;
        case 'lock':
          success = await warehouseTransferApi.lockWarehouseTransfer(transferNumber);
          message = 'Sevk başarıyla kilitlendi';
          break;
        case 'unlock':
          success = await warehouseTransferApi.unlockWarehouseTransfer(transferNumber);
          message = 'Sevk kilidi başarıyla açıldı';
          break;
      }
      
      if (success) {
        enqueueSnackbar(message, { variant: 'success' });
        fetchTransferData(); // Verileri yenile
      } else {
        enqueueSnackbar('İşlem başarısız oldu', { variant: 'error' });
      }
    } catch (error) {
      console.error(`Error performing ${actionType} action:`, error);
      enqueueSnackbar('İşlem sırasında bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
      setActionType(null);
    }
  };
  
  // Onay dialogu içeriği
  const getDialogContent = () => {
    if (!actionType || !transferNumber) return '';
    
    switch (actionType) {
      case 'approve':
        return `"${transferNumber}" numaralı sevki onaylamak istediğinize emin misiniz?`;
      case 'cancel':
        return `"${transferNumber}" numaralı sevki iptal etmek istediğinize emin misiniz?`;
      case 'lock':
        return `"${transferNumber}" numaralı sevki kilitlemek istediğinize emin misiniz?`;
      case 'unlock':
        return `"${transferNumber}" numaralı sevkin kilidini açmak istediğinize emin misiniz?`;
      default:
        return '';
    }
  };
  
  // Listeye dön fonksiyonu
  const handleBack = () => {
    navigate('/inventory/warehouse-transfers');
  };
  
  // Yazdırma fonksiyonu
  const handlePrint = () => {
    window.print();
  };
  
  if (loading && !transfer) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (!transfer) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 3, mb: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Sevk bulunamadı
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mt: 2 }}
          >
            Listeye Dön
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" className="print-container" sx={{ px: { xs: 1, sm: 2 } }}>
      {/* Başlık - En üstte */}
      <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton onClick={handleBack} className="no-print" size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ flex: 1, textAlign: 'center' }}>
            Sevk Detayları
          </Typography>
          <Tooltip title="Yazdır">
            <IconButton onClick={handlePrint} className="no-print" size="small">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* 3 Ana buton yan yana */}
        {!transfer.isCompleted && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 1, 
            mb: 2,
            '& .MuiButton-root': {
              flex: 1,
              mx: 0.5,
              py: 1,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }
          }} className="no-print">
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={() => openConfirmDialog('approve')}
            >
              ONAYLA
            </Button>
            
            <Button
              variant="contained"
              color="error"
              startIcon={<CloseIcon />}
              onClick={() => openConfirmDialog('cancel')}
            >
              İPTAL ET
            </Button>
            
            {transfer.isLocked ? (
              <Button
                variant="outlined"
                startIcon={<LockOpenIcon />}
                onClick={() => openConfirmDialog('unlock')}
              >
                KİLİTLE
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => openConfirmDialog('lock')}
              >
                KİLİTLE
              </Button>
            )}
          </Box>
        )}

        {/* Sevk Bilgileri - Mobil için optimize edilmiş */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 2 }}>
              Sevk Bilgileri
            </Typography>

            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 2
            }}>
              {/* 1. Kolon: Sevk No ve İşlem Tarihi */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    Sevk Numarası
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {transfer.transferNumber}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    İşlem Tarihi
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                    {formatDate(transfer.operationDate)}
                  </Typography>
                </Box>
              </Box>
              
              {/* 2. Kolon: Kaynak Depo ve Hedef Depo */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    Kaynak Depo
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                    {transfer.sourceWarehouseCode} - {transfer.sourceWarehouseName}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    Hedef Depo
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                    {transfer.targetWarehouseCode} - {transfer.targetWarehouseName}
                  </Typography>
                </Box>
              </Box>
              
              {/* 3. Kolon: Miktar, Durum ve Açıklama */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    Toplam Miktar
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                    {transfer.totalQty}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    Durum
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    {transfer.isCompleted ? (
                      <Chip label="Onaylandı" color="success" size="small" sx={{ height: '24px', fontSize: '0.8rem' }} />
                    ) : transfer.isLocked ? (
                      <Chip label={`Kilitli`} color="warning" size="small" sx={{ height: '24px', fontSize: '0.8rem' }} />
                    ) : (
                      <Chip label="Bekliyor" color="default" size="small" sx={{ height: '24px', fontSize: '0.8rem' }} />
                    )}
                  </Box>
                </Box>
                

              </Box>

              {transfer.isLocked && (
                <>
                  <Box className="info-item">
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                      Kilitleyen Kullanıcı
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                      {transfer.lockedByUser}
                    </Typography>
                  </Box>

                  <Box className="info-item">
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                      Kilit Tarihi
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                      {transfer.lockDate ? formatDateTime(transfer.lockDate) : '-'}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Sevk Kalemleri - Mobil için optimize edilmiş */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 2 }}>
              Sevk Kalemleri
            </Typography>

            {/* Mobil için optimize edilmiş sevk kalemleri listesi */}
            {transferItems.length === 0 ? (
              <Typography variant="body2" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                Sevk kalemi bulunamadı
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {transferItems.map((item, index) => (
                  <Card key={index} variant="outlined" sx={{ 
                    borderRadius: 1,
                    boxShadow: 'none',
                    border: '1px solid #eee',
                    overflow: 'visible'
                  }}>
                    {/* Başlık - Ürün Adı ve Sıra */}
                    <Box sx={{ 
                      p: 1.5, 
                      pb: 0.5,
                      display: 'flex', 
                      alignItems: 'center', 
                      borderBottom: '1px solid #f5f5f5'
                    }}>
                      <Chip 
                        label={`#${index + 1}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ mr: 1, height: '20px', fontSize: '0.7rem', minWidth: '30px' }} 
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {item.itemName}
                      </Typography>
                    </Box>
                    
                    {/* Ürün Detayları */}
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
                    }}>
                      {/* 1. Kolon: Ürün kodu, açıklama, renk, beden, barkod */}
                      <Box sx={{ p: 1.5, pt: 1 }}>
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: 1,
                          fontSize: '0.8rem'
                        }}>
                          <Box>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Ürün Kodu
                            </Typography>
                            <Typography variant="body2">{item.itemCode}</Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Barkod
                            </Typography>
                            <Typography variant="body2">{item.barcode || '-'}</Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Renk
                            </Typography>
                            <Typography variant="body2">{item.colorName || '-'}</Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Beden
                            </Typography>
                            <Typography variant="body2">{item.itemDim1Name || '-'}</Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* 2. Kolon: Miktar ve işlemler */}
                      <Box sx={{ 
                        p: 1.5, 
                        pt: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        borderLeft: { xs: 'none', sm: '1px solid #f5f5f5' },
                        borderTop: { xs: '1px solid #f5f5f5', sm: 'none' }
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {item.quantity} {item.unitCode || 'AD'}
                            </Typography>
                          </Box>
                          
                          {!transfer.isCompleted && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton size="small" color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
      
      {/* Onay Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        className="no-print"
      >
        <DialogTitle>
          {actionType === 'approve' && 'Sevk Onaylama'}
          {actionType === 'cancel' && 'Sevk İptal Etme'}
          {actionType === 'lock' && 'Sevk Kilitleme'}
          {actionType === 'unlock' && 'Sevk Kilit Açma'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {getDialogContent()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
            Vazgeç
          </Button>
          <Button 
            onClick={handleAction} 
            color={actionType === 'cancel' ? 'error' : 'primary'} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Onayla'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Yazdırma için CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}} />
    </Container>
  );
};

export default WarehouseTransferDetailPage;
