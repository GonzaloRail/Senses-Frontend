export type AssetOrigin = 'Compra Factura' | 'Compra Boleta' | 'Aporte Socio' | 'Otros';
export type AssetStatus = 'Operativo' | 'Mantenimiento' | 'Dado de Baja';
export type AssetCategory = 'Equipos' | 'Muebles' | 'Electrónicos' | 'Otros';

export interface Asset {
  id: string;
  origenAdquisicion: AssetOrigin;
  detalleOrigen?: string; // e.g. "FACTURA 001-232" or "David Telles"
  denominacion: string;
  marca: string;
  modelo: string;
  categoria: AssetCategory; // (Tipo)
  color: string;
  serie: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  situacion: AssetStatus;
  imagenUrl?: string;
  createdAt: string;
}

// Initial mock data based on the Excel
let mockAssets: Asset[] = [
  {
    id: "a1",
    origenAdquisicion: "Compra Factura",
    detalleOrigen: "SI",
    denominacion: "SILLAS",
    marca: "NO ESPECIFICA",
    modelo: "NO ESPECIFICA",
    categoria: "Muebles",
    color: "NEGRO",
    serie: "NO ESPECIFICA",
    cantidad: 10,
    precioUnitario: 42,
    total: 420,
    situacion: "Operativo",
    createdAt: "2026-01-15T10:00:00Z"
  },
  {
    id: "a2",
    origenAdquisicion: "Aporte Socio",
    detalleOrigen: "David Telles Aleman",
    denominacion: "MUEBLE DE MELAMINA",
    marca: "NO ESPECIFICA",
    modelo: "NO ESPECIFICA",
    categoria: "Muebles",
    color: "CAFÉ",
    serie: "NO CORRESPONDE",
    cantidad: 1,
    precioUnitario: 140,
    total: 140,
    situacion: "Operativo",
    createdAt: "2022-05-10T10:00:00Z"
  },
  {
    id: "a3",
    origenAdquisicion: "Aporte Socio",
    detalleOrigen: "AUMENTO DE CAPITAL",
    denominacion: "BANCAS MOLD PLAST",
    marca: "MOLD PLAST",
    modelo: "NO ESPECIFICA",
    categoria: "Muebles",
    color: "CELESTE",
    serie: "NO ESPECIFICA",
    cantidad: 15,
    precioUnitario: 10,
    total: 150,
    situacion: "Mantenimiento",
    createdAt: "2026-08-20T10:00:00Z"
  }
];

export const getMockAssets = async (): Promise<Asset[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockAssets].filter(a => a.situacion !== 'Dado de Baja'));
    }, 500); // Simulate network delay
  });
};

export const createMockAsset = async (assetData: Omit<Asset, 'id' | 'createdAt' | 'total'>): Promise<Asset> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newAsset: Asset = {
        ...assetData,
        id: Math.random().toString(36).substring(7),
        total: assetData.cantidad * assetData.precioUnitario,
        createdAt: new Date().toISOString()
      };
      mockAssets = [newAsset, ...mockAssets];
      resolve(newAsset);
    }, 500);
  });
};

export const deleteMockAsset = async (id: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockAssets = mockAssets.map(a => 
        a.id === id ? { ...a, situacion: 'Dado de Baja' } : a
      );
      resolve();
    }, 500);
  });
};
