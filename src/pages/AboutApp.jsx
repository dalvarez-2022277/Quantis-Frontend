import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import {
  APP_NAME,
  APP_VERSION,
  COPYRIGHT_OWNER,
  DEVELOPER_NAME,
  DEVELOPER_ATTRIBUTION,
  getCopyrightLine,
} from '../config/appMeta'

const APP_ICON_SRC = '/assets/logos/Quantisicon.png'

const AboutApp = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 pb-8">
      <div className="max-w-lg mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <motion.header
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:text-q-primary hover:border-q-primary/40 hover:bg-q-primary/5 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-q-primary/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              aria-label="Volver"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-q-primary/20 to-q-primary/5 dark:from-q-primary/30 dark:to-q-primary/15 flex items-center justify-center shadow-sm">
              <InformationCircleIcon className="h-6 w-6 text-q-primary" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-q-primary mb-1">
                Información
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Acerca de {APP_NAME}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-snug">
                Versión, derechos y créditos de la aplicación.
              </p>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
          className="space-y-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col items-center text-center">
            <img
              src={APP_ICON_SRC}
              alt={`Logotipo ${APP_NAME}`}
              width={72}
              height={72}
              className="mb-4 h-[72px] w-[72px] object-contain flex-shrink-0 rounded-2xl shadow-sm ring-1 ring-gray-200/80 dark:ring-gray-600/80"
              decoding="async"
            />
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{APP_NAME}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Versión <span className="font-mono text-gray-700 dark:text-gray-300">{APP_VERSION}</span>
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Créditos
            </h2>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {DEVELOPER_NAME}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {DEVELOPER_ATTRIBUTION}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Copyright
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {getCopyrightLine()}
            </p>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              Titular: {COPYRIGHT_OWNER}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AboutApp
