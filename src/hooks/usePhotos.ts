import { useState, useCallback } from 'react';
import { db } from '../db';
import type { PhotoItem } from '../db';
import { useAppContext } from '../context/AppContext';
import { analyzeScreenshot, generateIGCaption } from '../utils/ai';
import { saveAs } from 'file-saver';
import type { CategoryKey } from '../constants';

export function usePhotos() {
  const { photos, loadPhotos, workerRef, apiKey } = useAppContext();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [aiAnalyzingIds, setAiAnalyzingIds] = useState<Set<string>>(new Set());
  const [aiResults, setAiResults] = useState<Record<string, { subCategory: string; summary: string; confidence: number }>>({});
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [igCaption, setIgCaption] = useState<string | null>(null);

  const processPhoto = useCallback(async (photo: PhotoItem) => {
    if (processingIds.has(photo.id)) return;
    setProcessingIds(prev => new Set(prev).add(photo.id));
    try {
      if (!workerRef.current) {
        const { createWorker } = await import('tesseract.js');
        workerRef.current = await createWorker('chi_tra+eng');
      }
      const { data: { text } } = await workerRef.current.recognize(photo.fullImage);
      const trimmed = text.trim();
      const isScreenshot = trimmed.length > 15 && /[\d\$￥€£¥]|http|@|#|NT\$|RMB|元|折|優惠|地址|電話|時間|日期/.test(trimmed);
      let category: CategoryKey = 'other';
      if (/價格|NT\$|¥|\$|元|折|優惠|特價|買|賣|包|免運/.test(trimmed)) category = 'shopping';
      else if (/地址|地圖|路|號|樓|店|餐廳|咖啡|捷運|站/.test(trimmed)) category = 'location';
      else if (/說過|曾經|語錄|名言|句子|寫道|讀到|聽到/.test(trimmed)) category = 'quote';
      else if (/食材|做法|步驟|料理|烘焙|煮|烤|炒|蒸|食譜/.test(trimmed)) category = 'recipe';
      else if (/會議|報告|截止日期|待辦|任務|客戶|專案|郵件/.test(trimmed)) category = 'work';
      
      await db.photos.update(photo.id, {
        ocrText: trimmed.slice(0, 2000),
        type: isScreenshot ? 'screenshot' : 'memory',
        noteCategory: isScreenshot ? category : undefined,
        postStatus: isScreenshot ? undefined : 'unposted',
      });
      await loadPhotos();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(photo.id);
        return next;
      });
    }
  }, [workerRef, loadPhotos, processingIds]);

  const processAll = useCallback(async () => {
    const targets = photos.filter(p => p.type === 'unknown');
    for (const p of targets) {
      await processPhoto(p);
    }
  }, [photos, processPhoto]);

  const aiAnalyzePhoto = useCallback(async (photo: PhotoItem) => {
    if (!apiKey || aiAnalyzingIds.has(photo.id)) return;
    setAiAnalyzingIds(prev => new Set(prev).add(photo.id));
    try {
      const result = await analyzeScreenshot(photo.fullImage, apiKey, photo.ocrText);
      await db.photos.update(photo.id, {
        noteCategory: result.category as CategoryKey,
      });
      setAiResults(prev => ({
        ...prev,
        [photo.id]: {
          subCategory: result.subCategory,
          summary: result.summary,
          confidence: result.confidence,
        },
      }));
      await loadPhotos();
    } catch (e) {
      console.error('AI analysis failed:', e);
      alert('AI 分析失敗，請檢查 API Key 是否有效');
    } finally {
      setAiAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(photo.id);
        return next;
      });
    }
  }, [apiKey, aiAnalyzingIds, loadPhotos]);

  const aiAnalyzeAll = useCallback(async () => {
    const targets = photos.filter(p => p.type === 'screenshot' && !aiAnalyzingIds.has(p.id));
    for (const p of targets.slice(0, 10)) {
      await aiAnalyzePhoto(p);
    }
  }, [photos, aiAnalyzingIds, aiAnalyzePhoto]);

  const generateCaption = useCallback(async (photo: PhotoItem, setShowSettings: (show: boolean) => void) => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    setGeneratingCaption(true);
    try {
      const caption = await generateIGCaption(photo.fullImage, photo.ocrText || '', apiKey);
      setIgCaption(caption);
    } catch (e) {
      console.error('Caption generation failed:', e);
      alert('文案生成失敗，請檢查 API Key');
    } finally {
      setGeneratingCaption(false);
    }
  }, [apiKey]);

  const updatePhoto = useCallback(async (id: string, changes: Partial<PhotoItem>) => {
    await db.photos.update(id, changes);
    await loadPhotos();
  }, [loadPhotos]);

  const deletePhoto = useCallback(async (id: string) => {
    await db.photos.update(id, { isDeleted: true });
    await loadPhotos();
  }, [loadPhotos]);

  const batchDelete = useCallback(async (ids: Set<string>) => {
    for (const id of ids) {
      await db.photos.update(id, { isDeleted: true });
    }
    await loadPhotos();
  }, [loadPhotos]);

  const batchMarkPosted = useCallback(async (ids: Set<string>) => {
    for (const id of ids) {
      await db.photos.update(id, { postStatus: 'posted' });
    }
    await loadPhotos();
  }, [loadPhotos]);

  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const exportZip = useCallback(async (selectedPhotos: PhotoItem[]) => {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const folder = zip.folder('相簿整理');
    const meta: any[] = [];

    for (const p of selectedPhotos) {
      const blob = dataURLtoBlob(p.fullImage);
      folder?.file(p.fileName, blob);
      meta.push({
        fileName: p.fileName,
        type: p.type,
        noteCategory: p.noteCategory,
        postStatus: p.postStatus,
        ocrText: p.ocrText?.slice(0, 500),
        createdAt: new Date(p.createdAt).toISOString(),
      });
    }
    folder?.file('metadata.json', JSON.stringify(meta, null, 2));
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `相簿整理-${new Date().toISOString().slice(0, 10)}.zip`);
  }, []);

  return {
    processingIds,
    aiAnalyzingIds,
    aiResults,
    generatingCaption,
    igCaption,
    processPhoto,
    processAll,
    aiAnalyzePhoto,
    aiAnalyzeAll,
    generateCaption,
    updatePhoto,
    deletePhoto,
    batchDelete,
    batchMarkPosted,
    exportZip
  };
}
