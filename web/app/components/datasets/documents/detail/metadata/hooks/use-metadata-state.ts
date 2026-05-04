'use client'
import type { CommonResponse } from '@/models/common'
import type { DocType, FullDocumentDetail } from '@/models/datasets'
import { toast } from '@langgenius/dify-ui/toast'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { modifyDocMetadata } from '@/service/datasets'
import { asyncRunSafe } from '@/utils'
import { useDocumentContext } from '../../context'

type MetadataState = {
  documentType?: DocType | ''
  metadata: Record<string, string>
}
/**
 * Normalize raw doc_type: treat 'others' as empty string.
 */
const normalizeDocType = (rawDocType: string): DocType | '' => {
  return rawDocType === 'others' ? '' : rawDocType as DocType | ''
}
type UseMetadataStateOptions = {
  docDetail?: FullDocumentDetail
  onUpdate?: () => void
}
export function useMetadataState({ docDetail, onUpdate }: UseMetadataStateOptions) {
  const { doc_metadata = {} } = docDetail || {}
  const rawDocType = docDetail?.doc_type ?? ''
  const docType = normalizeDocType(rawDocType)
  const { t } = useTranslation()
  const datasetId = useDocumentContext(s => s.datasetId)
  const documentId = useDocumentContext(s => s.documentId)

  // If no documentType yet, start in editing + showDocTypes mode
  const [editStatus, setEditStatus] = useState(!docType)
  const [metadataParams, setMetadataParams] = useState<MetadataState>(docType
    ? { documentType: docType, metadata: (doc_metadata || {}) as Record<string, string> }
    : { metadata: {} })
  const [showDocTypes, setShowDocTypes] = useState(!docType)
  const [tempDocType, setTempDocType] = useState<DocType | ''>('')
  const [saveLoading, setSaveLoading] = useState(false)

  // Track the last upstream snapshot to detect when docDetail changes.
  // Storing refs (not state) avoids extra renders from tracking metadata.
  const prevDocTypeRef = useRef(docDetail?.doc_type)
  const prevDocMetadataRef = useRef(docDetail?.doc_metadata)

  // Sync editing state when docDetail is updated by the server (e.g. after save
  // or document navigation).  Using the "setState during render" pattern keeps
  // this synchronous and avoids calling set functions inside useEffect.
  //
  // React allows calling a set function during render as long as the condition
  // is based on props / previous render state and the call is outside any
  // effect – React will discard the current render output and immediately
  // re-render with the updated state.
  //
  // Ref: https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const docTypeChanged = prevDocTypeRef.current !== docDetail?.doc_type
  const metadataChanged = prevDocMetadataRef.current !== docDetail?.doc_metadata

  if ((docTypeChanged || metadataChanged) && docDetail?.doc_type) {
    prevDocTypeRef.current = docDetail.doc_type
    prevDocMetadataRef.current = docDetail.doc_metadata
    const freshDocType = normalizeDocType(docDetail.doc_type)
    setEditStatus(false)
    setShowDocTypes(false)
    setTempDocType(freshDocType)
    setMetadataParams({
      documentType: freshDocType,
      metadata: (docDetail.doc_metadata || {}) as Record<string, string>,
    })
  }

  const confirmDocType = () => {
    if (!tempDocType)
      return
    setMetadataParams({
      documentType: tempDocType,
      // Clear metadata when switching to a different doc type
      metadata: tempDocType === metadataParams.documentType ? metadataParams.metadata : {},
    })
    setEditStatus(true)
    setShowDocTypes(false)
  }
  const cancelDocType = () => {
    setTempDocType(metadataParams.documentType ?? '')
    setEditStatus(true)
    setShowDocTypes(false)
  }
  const enableEdit = () => {
    setEditStatus(true)
  }
  const cancelEdit = () => {
    setMetadataParams({ documentType: docType || '', metadata: { ...docDetail?.doc_metadata } })
    setEditStatus(!docType)
    if (!docType)
      setShowDocTypes(true)
  }
  const saveMetadata = async () => {
    setSaveLoading(true)
    const [e] = await asyncRunSafe<CommonResponse>(modifyDocMetadata({
      datasetId,
      documentId,
      body: {
        doc_type: metadataParams.documentType || docType || '',
        doc_metadata: metadataParams.metadata,
      },
    }) as Promise<CommonResponse>)
    if (!e)
      toast.success(t('actionMsg.modifiedSuccessfully', { ns: 'common' }))
    else
      toast.error(t('actionMsg.modifiedUnsuccessfully', { ns: 'common' }))
    onUpdate?.()
    setEditStatus(false)
    setSaveLoading(false)
  }
  const updateMetadataField = (field: string, value: string) => {
    setMetadataParams(prev => ({ ...prev, metadata: { ...prev.metadata, [field]: value } }))
  }
  return {
    docType,
    editStatus,
    showDocTypes,
    tempDocType,
    saveLoading,
    metadataParams,
    setTempDocType,
    setShowDocTypes,
    confirmDocType,
    cancelDocType,
    enableEdit,
    cancelEdit,
    saveMetadata,
    updateMetadataField,
  }
}
