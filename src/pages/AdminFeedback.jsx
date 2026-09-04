import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  BugAntIcon,
  LightBulbIcon,
  EllipsisHorizontalCircleIcon,
  ArrowPathIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { feedbackApi, getAvatarUrl } from '../api/api';
import { useAuthContext } from '../contexts/AuthContext';
import FloatingModal from '../components/FloatingModal';

const PAGE_SIZE = 20;

const TYPE_META = {
  bug: { label: 'Bug', Icon: BugAntIcon, className: 'text-rose-600 dark:text-rose-400' },
  suggestion: {
    label: 'Sugerencia',
    Icon: LightBulbIcon,
    className: 'text-amber-500 dark:text-amber-400'
  },
  other: { label: 'Otro', Icon: EllipsisHorizontalCircleIcon, className: 'text-sky-600 dark:text-sky-400' }
};

function normalizeListResponse(data) {
  if (!data) return { items: [], total: 0 };
  if (Array.isArray(data.items) && typeof data.total === 'number') {
    return { items: data.items, total: data.total };
  }
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (Array.isArray(data.items))
    return { items: data.items, total: typeof data.total === 'number' ? data.total : data.items.length };
  if (Array.isArray(data.data))
    return { items: data.data, total: typeof data.total === 'number' ? data.total : data.data.length };
  return { items: [], total: 0 };
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case 'new':
      return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    case 'in_progress':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
    case 'resolved':
      return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

/** Badge según lectura y estado de workflow */
function getListAccent(row) {
  const st = row.status;
  const opened = !!row.adminOpenedAt;
  if (st === 'new' && !opened) {
    return {
      label: 'Nuevo',
      badgeClass: statusBadgeClass('new')
    };
  }
  if (st === 'in_progress') {
    return {
      label: 'En progreso',
      badgeClass: statusBadgeClass('in_progress')
    };
  }
  if (st === 'resolved') {
    return {
      label: 'Resuelto',
      badgeClass: statusBadgeClass('resolved')
    };
  }
  if (st === 'new' && opened) {
    return {
      label: 'Recibido',
      badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
    };
  }
  return {
    label: '—',
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
  };
}

export default function AdminFeedback() {
  const navigate = useNavigate();
  const { showError, showSuccess, imageTimestamp } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isDesktopModal, setIsDesktopModal] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1280
  );

  useEffect(() => {
    const onResize = () => setIsDesktopModal(window.innerWidth >= 1280);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await feedbackApi.adminList({
        page,
        limit: PAGE_SIZE
      });
      const { items: list, total: t } = normalizeListResponse(raw);
      setItems(list);
      setTotal(t);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al cargar feedback';
      showError?.(msg);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const detailId = detail?.id ?? detail?._id;

  useEffect(() => {
    if (!detail || !detailId) return;
    if (detail.adminOpenedAt) return;
    let cancelled = false;
    feedbackApi
      .adminPatch(String(detailId), { markOpened: true })
      .then((raw) => {
        if (cancelled) return;
        const updated = raw?.data ?? raw;
        if (!updated) return;
        setDetail((d) =>
          d && String(d.id ?? d._id) === String(detailId) ? { ...d, ...updated } : d
        );
        setItems((prev) =>
          prev.map((it) =>
            String(it.id ?? it._id) === String(detailId)
              ? { ...it, adminOpenedAt: updated.adminOpenedAt }
              : it
          )
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [detailId, detail?.adminOpenedAt]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  /** Solo cierra el panel (igual que la X o tocar fuera). No cambia el caso en la BD. */
  const handleCloseModalOnly = () => {
    setDetail(null);
  };

  /** Marca el feedback como resuelto en la BD y cierra (sigue apareciendo en el historial). */
  const handleMarcarResuelto = async () => {
    if (!detailId || !detail || saving) return;
    if (detail.status === 'resolved') return;
    setSaving(true);
    try {
      await feedbackApi.adminPatch(String(detailId), { status: 'resolved' });
      showSuccess?.('Caso marcado como resuelto.');
      await load();
      setDetail(null);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.response?.data?.error || e?.message || 'No se pudo actualizar el caso';
      showError?.(msg);
    } finally {
      setSaving(false);
    }
  };

  const hasNextPage = page * PAGE_SIZE < total;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  /** Misma regla que Ingresos: solo paginar si hay más de 15 ítems en total */
  const showPagination = !loading && items.length > 0 && total > 15;

  const userAvatarSrc = useMemo(() => {
    if (!detail?.user) return null;
    const u = detail.user;
    const path = u.profileImage || u.avatar;
    if (!path) return null;
    return getAvatarUrl(path, imageTimestamp);
  }, [detail?.user, imageTimestamp]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 scroll-container">
      <div className="mx-auto max-w-6xl px-4 py-6 pb-10 sm:px-6">
        {/* Cabecera: misma estética que Ingresos / Gastos */}
        <motion.header
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400/40 focus:ring-offset-2 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:shadow-md dark:hover:border-gray-400 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-offset-gray-900 sm:h-11 sm:w-11"
                aria-label="Regresar al inicio"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-700 sm:px-5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-gray-400/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:scale-[0.98]"
              >
                <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar lista</span>
                <span className="sm:hidden">Actualizar</span>
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-200/90 to-gray-100/60 shadow-sm dark:from-gray-700 dark:to-gray-800/90 dark:shadow-inner sm:h-14 sm:w-14">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-600 sm:h-7 sm:w-7 dark:text-gray-300" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Administración
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  Bandeja de feedback
                </h1>
                <p className="mt-2 max-w-md text-sm leading-snug text-gray-500 dark:text-gray-300">
                  Gestiona y revisa los comentarios y reportes de quienes usan la app.
                </p>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
          <div className="p-4">
            {loading && !refreshing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando mensajes…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-14 text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">No hay mensajes aún</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  Cuando alguien envíe feedback aparecerá aquí.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((row) => {
                  const id = row.id ?? row._id;
                  const tMeta = TYPE_META[row.type] || TYPE_META.other;
                  const TIcon = tMeta.Icon;
                  const accent = getListAccent(row);
                  return (
                    <li key={String(id)}>
                      <button
                        type="button"
                        onClick={() => setDetail({ ...row })}
                        className="flex w-full min-h-[7.25rem] rounded-xl bg-transparent text-left transition-colors hover:bg-gray-100/90 dark:hover:bg-gray-800/60"
                      >
                        <div className="flex w-full items-stretch gap-3 p-4">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 ${tMeta.className}`}
                          >
                            <TIcon className="h-5 w-5" aria-hidden />
                          </span>
                          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="min-w-0 flex-1 truncate text-left font-semibold text-gray-900 dark:text-white">
                                {row.title || 'Sin título'}
                              </p>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${accent.badgeClass}`}
                              >
                                {accent.label}
                              </span>
                            </div>
                            {/* Altura fija: el texto largo se corta; el detalle muestra el mensaje completo */}
                            <div className="mt-1.5 h-[2.625rem] flex-shrink-0 overflow-hidden sm:h-[2.75rem]">
                              <p className="line-clamp-2 text-left text-sm leading-snug text-gray-600 dark:text-gray-400">
                                {row.message}
                              </p>
                            </div>
                            <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 pt-2 text-[11px] text-gray-500 dark:text-gray-500">
                              <span className="shrink-0">{tMeta.label}</span>
                              <span className="shrink-0">·</span>
                              <span className="shrink-0">{formatDate(row.createdAt || row.created_at)}</span>
                              {row.user?.email && (
                                <>
                                  <span className="shrink-0">·</span>
                                  <span className="min-w-0 truncate">{row.user.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {showPagination && (
            <div className="flex gap-2 border-t border-gray-100 bg-white/50 p-3 dark:border-gray-700/80 dark:bg-gray-800/30">
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {rangeStart}-{rangeEnd} de {total}
                </span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="Página anterior"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="min-w-[4rem] text-center text-xs font-medium tabular-nums text-gray-700 dark:text-gray-300">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNextPage}
                  className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="Página siguiente"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <FloatingModal
        isOpen={!!detail}
        onClose={handleCloseModalOnly}
        title={detail?.title || 'Detalle'}
        size="lg"
        compactHeader
        showCloseButton
        showDragHandle={!isDesktopModal}
        closeButtonStyle={isDesktopModal ? 'default' : 'circle'}
        bottomSheet={!isDesktopModal}
      >
        {detail && (
          <div className={isDesktopModal ? 'px-6 pb-6 pt-2' : 'px-4 pb-6 pt-2'}>
            <div className="mb-4">
              {(() => {
                const tm = TYPE_META[detail.type] || TYPE_META.other;
                const TI = tm.Icon;
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 text-xs font-semibold dark:bg-gray-800 ${tm.className}`}
                  >
                    <TI className="h-4 w-4 shrink-0" aria-hidden />
                    {tm.label}
                  </span>
                );
              })()}
            </div>

            {detail.user && (
              <div className="mb-4 flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
                {userAvatarSrc ? (
                  <img
                    src={userAvatarSrc}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                  />
                ) : (
                  <UserCircleIcon className="h-12 w-12 shrink-0 text-gray-400" />
                )}
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">{detail.user.name || 'Usuario'}</p>
                  <p className="truncate text-gray-600 dark:text-gray-400">{detail.user.email}</p>
                </div>
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Mensaje
                </p>
                <p className="mt-1 whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-gray-800 dark:bg-gray-900/60 dark:text-gray-100">
                  {detail.message || '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Fecha
                </p>
                <p className="text-gray-900 dark:text-white">{formatDate(detail.createdAt || detail.created_at)}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {detail.status !== 'resolved' && (
                <button
                  type="button"
                  onClick={() => void handleMarcarResuelto()}
                  disabled={saving}
                  className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                >
                  {saving ? 'Guardando…' : 'Marcar como resuelto'}
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseModalOnly}
                className="w-full rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </FloatingModal>
    </div>
  );
}
