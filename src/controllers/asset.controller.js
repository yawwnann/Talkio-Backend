const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

// GET /api/admin/assets — List semua aset
const getAllAssets = async (req, res) => {
  try {
    const { search, kategori } = req.query;

    const where = {};
    if (kategori) where.kategori = kategori;
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { kode: { contains: search } },
        { keterangan: { contains: search } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return sendResponse(res, 200, "Assets fetched", assets);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// POST /api/admin/assets — Tambah aset baru
const createAsset = async (req, res) => {
  try {
    const { kode, nama, kategori, jumlah, satuan, keterangan, kondisi } = req.body;

    if (!kode || !nama) {
      return sendResponse(res, 400, "Kode dan nama aset wajib diisi");
    }

    // Cek apakah kode sudah ada
    const existing = await prisma.asset.findUnique({ where: { kode } });
    if (existing) {
      return sendResponse(res, 400, `Kode "${kode}" sudah digunakan`);
    }

    const asset = await prisma.asset.create({
      data: {
        kode,
        nama,
        kategori: kategori || null,
        jumlah: parseInt(jumlah) || 0,
        satuan: satuan || null,
        keterangan: keterangan || null,
        kondisi: kondisi || "BAIK",
      },
    });

    return sendResponse(res, 201, "Asset berhasil ditambahkan", asset);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// PUT /api/admin/assets/:id — Update aset
const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { kode, nama, kategori, jumlah, satuan, keterangan, kondisi } = req.body;

    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      return sendResponse(res, 404, "Asset tidak ditemukan");
    }

    // Cek kode konflik jika kode diubah
    if (kode && kode !== existing.kode) {
      const kodeTaken = await prisma.asset.findUnique({ where: { kode } });
      if (kodeTaken) {
        return sendResponse(res, 400, `Kode "${kode}" sudah digunakan`);
      }
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        kode: kode ?? existing.kode,
        nama: nama ?? existing.nama,
        kategori: kategori !== undefined ? kategori : existing.kategori,
        jumlah: jumlah !== undefined ? parseInt(jumlah) : existing.jumlah,
        satuan: satuan !== undefined ? satuan : existing.satuan,
        keterangan: keterangan !== undefined ? keterangan : existing.keterangan,
        kondisi: kondisi ?? existing.kondisi,
      },
    });

    return sendResponse(res, 200, "Asset berhasil diperbarui", updated);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// DELETE /api/admin/assets/:id — Hapus aset
const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      return sendResponse(res, 404, "Asset tidak ditemukan");
    }

    await prisma.asset.delete({ where: { id } });

    return sendResponse(res, 200, "Asset berhasil dihapus");
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = { getAllAssets, createAsset, updateAsset, deleteAsset };
