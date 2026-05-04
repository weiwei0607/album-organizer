import { useState, useCallback, useRef } from 'react';
import { db } from '../db';
import type { Journey, PhotoItem } from '../db';
import { useAppContext } from '../context/AppContext';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

export function formatDateRange(start: number, end: number): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${s.getMonth() + 1}/${s.getDate()} - ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export function useJourneys() {
  const { photos, journeys, loadJourneys, apiKey, isDark } = useAppContext();
  const [generatingJourneyStory, setGeneratingJourneyStory] = useState(false);
  const [exportingJourney, setExportingJourney] = useState(false);
  const journeyRef = useRef<HTMLDivElement | null>(null);

  const detectJourneyClusters = useCallback((allPhotos: PhotoItem[]): string[][] => {
    const memoryPhotos = allPhotos
      .filter(p => p.type === 'memory' && !p.isDeleted)
      .sort((a, b) => a.createdAt - b.createdAt);

    if (memoryPhotos.length < 3) return [];

    const DAY_MS = 24 * 60 * 60 * 1000;
    const GAP_THRESHOLD = 3 * DAY_MS; 
    const MIN_PHOTOS = 3;
    const MIN_SPAN = 0.5 * DAY_MS;

    const clusters: string[][] = [];
    let current: string[] = [memoryPhotos[0].id];
    let currentStart = memoryPhotos[0].createdAt;

    for (let i = 1; i < memoryPhotos.length; i++) {
      const gap = memoryPhotos[i].createdAt - memoryPhotos[i - 1].createdAt;
      if (gap <= GAP_THRESHOLD) {
        current.push(memoryPhotos[i].id);
      } else {
        const span = memoryPhotos[i - 1].createdAt - currentStart;
        if (current.length >= MIN_PHOTOS && span >= MIN_SPAN) {
          clusters.push([...current]);
        }
        current = [memoryPhotos[i].id];
        currentStart = memoryPhotos[i].createdAt;
      }
    }

    if (current.length >= MIN_PHOTOS) {
      const lastPhoto = memoryPhotos.find(p => p.id === current[current.length - 1]);
      const firstPhoto = memoryPhotos.find(p => p.id === current[0]);
      if (lastPhoto && firstPhoto && (lastPhoto.createdAt - firstPhoto.createdAt) >= MIN_SPAN) {
        clusters.push(current);
      }
    }

    return clusters;
  }, []);

  const autoDetectJourneys = useCallback(async () => {
    const clusters = detectJourneyClusters(photos);
    const existingPhotoIds = new Set(journeys.flatMap(j => j.photoIds));

    for (const photoIds of clusters) {
      const allInExisting = photoIds.every(id => existingPhotoIds.has(id));
      if (allInExisting) continue;

      const clusterPhotos = photos.filter(p => photoIds.includes(p.id));
      if (clusterPhotos.length === 0) continue;

      const startDate = Math.min(...clusterPhotos.map(p => p.createdAt));
      const endDate = Math.max(...clusterPhotos.map(p => p.createdAt));

      let name = `旅程 ${formatDateRange(startDate, endDate)}`;
      let location: string | undefined;
      let description: string | undefined;

      if (apiKey && clusterPhotos.length > 0) {
        try {
          const coverPhoto = clusterPhotos[0];
          const systemPrompt = `你是一個旅遊達人，根據這組旅行照片，請幫這趟旅程取一個有詩意的標題，並推測地點，寫一段 50 字內的遊記開頭。請返回 JSON：{"name": "標題", "location": "地點", "description": "遊記開頭"}`;
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                {
                  role: 'user',
                  content: [
                    { type: 'image_url', image_url: { url: coverPhoto.fullImage, detail: 'low' } },
                    { type: 'text', text: `這組旅程有 ${clusterPhotos.length} 張照片，時間從 ${new Date(startDate).toLocaleDateString()} 到 ${new Date(endDate).toLocaleDateString()}。請為這趟旅程命名。` },
                  ],
                },
              ],
              max_tokens: 200,
              temperature: 0.6,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const raw = data.choices[0]?.message?.content || '{}';
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
            name = parsed.name || name;
            location = parsed.location;
            description = parsed.description;
          }
        } catch (e) {
          console.error('AI journey naming failed:', e);
        }
      }

      const journey: Journey = {
        id: generateId(),
        name,
        startDate,
        endDate,
        photoIds: photoIds.slice(0, 30),
        location,
        description,
        coverPhotoId: photoIds[0],
        aiGenerated: true,
      };

      await db.journeys.add(journey);
    }
    await loadJourneys();
  }, [photos, journeys, detectJourneyClusters, apiKey, loadJourneys]);

  const createManualJourney = useCallback(async (journeyPhotoIds: Set<string>) => {
    if (journeyPhotoIds.size < 2) return;
    const selectedPhotos = photos.filter(p => journeyPhotoIds.has(p.id));
    const startDate = Math.min(...selectedPhotos.map(p => p.createdAt));
    const endDate = Math.max(...selectedPhotos.map(p => p.createdAt));

    const journey: Journey = {
      id: generateId(),
      name: `我的旅程 ${formatDateRange(startDate, endDate)}`,
      startDate,
      endDate,
      photoIds: Array.from(journeyPhotoIds),
      coverPhotoId: Array.from(journeyPhotoIds)[0],
    };

    await db.journeys.add(journey);
    await loadJourneys();
  }, [photos, loadJourneys]);

  const generateJourneyStory = useCallback(async (journey: Journey, setActiveJourney: (j: Journey) => void, setShowSettings: (s: boolean) => void) => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    setGeneratingJourneyStory(true);
    try {
      const journeyPhotos = photos.filter(p => journey.photoIds.includes(p.id)).slice(0, 5);
      const content: any[] = [
        { type: 'text', text: `這是一趟${journey.location || ''}的旅程，時間是 ${formatDateRange(journey.startDate, journey.endDate)}，共 ${journey.photoIds.length} 張照片。請根據這些照片寫一段 100 字以內的旅遊遊記，風格溫暖、有畫面感，像跟朋友分享旅行見聞。` },
      ];
      for (const p of journeyPhotos) {
        content.push({ type: 'image_url', image_url: { url: p.fullImage, detail: 'low' } });
      }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: '你是一個擅長寫旅遊遊記的作家，用繁體中文寫作，風格溫暖有畫面感。' },
            { role: 'user', content: content },
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const story = data.choices[0]?.message?.content?.trim() || '';
        await db.journeys.update(journey.id, { description: story });
        await loadJourneys();
        setActiveJourney({ ...journey, description: story });
      }
    } catch (e) {
      console.error('Story generation failed:', e);
      alert('遊記生成失敗');
    } finally {
      setGeneratingJourneyStory(false);
    }
  }, [apiKey, photos, loadJourneys]);

  const deleteJourney = useCallback(async (id: string, setActiveJourney: (j: null) => void) => {
    if (!confirm('確定要刪除這個旅程嗎？照片不會被刪除。')) return;
    await db.journeys.delete(id);
    await loadJourneys();
    setActiveJourney(null);
  }, [loadJourneys]);

  const exportJourneyImage = useCallback(async (journey: Journey) => {
    if (!journeyRef.current) return;
    setExportingJourney(true);
    try {
      const canvas = await html2canvas(journeyRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: isDark ? '#171717' : '#ffffff',
        logging: false,
      });
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${journey.name}-${new Date().toISOString().slice(0, 10)}.png`);
        }
      });
    } catch (e) {
      console.error('Export failed:', e);
      alert('匯出失敗');
    } finally {
      setExportingJourney(false);
    }
  }, [isDark]);

  const buildJourneyMarkdown = useCallback((journey: Journey): string => {
    const journeyPhotos = photos.filter(p => journey.photoIds.includes(p.id));
    let md = `# ${journey.name}\n\n`;
    md += `📅 ${formatDateRange(journey.startDate, journey.endDate)}\n\n`;
    if (journey.location) md += `📍 ${journey.location}\n\n`;
    if (journey.description) md += `${journey.description}\n\n`;
    md += `---\n\n`;
    md += `## 照片紀錄\n\n`;
    journeyPhotos.forEach((p, i) => {
      md += `### 照片 ${i + 1}\n\n`;
      md += `![${p.fileName}](${p.fileName})\n\n`;
      if (p.ocrText) md += `> ${p.ocrText.slice(0, 200).replace(/\n/g, ' ')}\n\n`;
    });
    md += `---\n\n`;
    md += `*匯出自 Album Organizer · ${new Date().toLocaleDateString()}*`;
    return md;
  }, [photos]);

  const exportJourneyData = useCallback(async (journey: Journey) => {
    const journeyPhotos = photos.filter(p => journey.photoIds.includes(p.id));
    const zip = new JSZip();
    const folder = zip.folder(journey.name.replace(/[^\w\s-]/g, ''));

    journeyPhotos.forEach((p, i) => {
      const blob = dataURLtoBlob(p.fullImage);
      const ext = p.fileName.split('.').pop() || 'jpg';
      folder?.file(`${String(i + 1).padStart(2, '0')}.${ext}`, blob);
    });

    folder?.file(`${journey.name}.md`, buildJourneyMarkdown(journey));
    folder?.file('journey.json', JSON.stringify({
      name: journey.name,
      startDate: new Date(journey.startDate).toISOString(),
      endDate: new Date(journey.endDate).toISOString(),
      location: journey.location,
      description: journey.description,
      photoCount: journeyPhotos.length,
      photos: journeyPhotos.map((p, i) => ({
        index: i + 1,
        fileName: p.fileName,
        createdAt: new Date(p.createdAt).toISOString(),
        ocrText: p.ocrText?.slice(0, 200),
      })),
    }, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${journey.name.replace(/\s+/g, '_')}.zip`);
  }, [photos, buildJourneyMarkdown]);

  return {
    autoDetectJourneys,
    createManualJourney,
    generateJourneyStory,
    deleteJourney,
    exportJourneyImage,
    exportJourneyData,
    buildJourneyMarkdown,
    generatingJourneyStory,
    exportingJourney,
    journeyRef,
  };
}
