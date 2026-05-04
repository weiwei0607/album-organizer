import React, { useState, useMemo } from 'react';
import { PenLine, Sparkles, X, Check, Map, CalendarDays, MapPin, Compass } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useJourneys, formatDateRange } from '../hooks/useJourneys';
import type { Journey } from '../db';

export const JourneysTab: React.FC = () => {
  const { photos, journeys } = useAppContext();
  const { autoDetectJourneys, createManualJourney } = useJourneys();
  
  const [creatingJourney, setCreatingJourney] = useState(false);
  const [journeyPhotoIds, setJourneyPhotoIds] = useState<Set<string>>(new Set());
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);

  const memoryPhotosForJourney = useMemo(() => {
    return photos
      .filter(p => p.type === 'memory' && !p.isDeleted)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [photos]);

  const toggleJourneyPhoto = (id: string) => {
    setJourneyPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateManual = async () => {
    await createManualJourney(journeyPhotoIds);
    setCreatingJourney(false);
    setJourneyPhotoIds(new Set());
  };

  // Render detail view if active journey
  // (In a full app this might be a separate screen, keeping it simple for the Tab)
  if (activeJourney) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
        <button onClick={() => setActiveJourney(null)} className="text-sm font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
          ← 返回旅程列表
        </button>
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800">
          <h2 className="text-xl font-black mb-2">{activeJourney.name}</h2>
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
            <CalendarDays className="w-4 h-4" />
            <span>{formatDateRange(activeJourney.startDate, activeJourney.endDate)}</span>
            {activeJourney.location && (
              <>
                <span>·</span>
                <MapPin className="w-4 h-4" />
                <span>{activeJourney.location}</span>
              </>
            )}
          </div>
          {activeJourney.description && (
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {activeJourney.description}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {photos.filter(p => activeJourney.photoIds.includes(p.id)).map(p => (
              <img key={p.id} src={p.thumbnail} alt="" className="aspect-square w-full object-cover rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (creatingJourney) {
              setCreatingJourney(false);
              setJourneyPhotoIds(new Set());
            } else {
              setCreatingJourney(true);
            }
          }}
          className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
            creatingJourney
              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md hover:shadow-lg'
          }`}
        >
          {creatingJourney ? <X className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
          {creatingJourney ? '取消' : '手動建立旅程'}
        </button>
        <button
          onClick={autoDetectJourneys}
          className="flex-1 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-sm font-bold shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          自動偵測旅程
        </button>
      </div>

      {/* Manual journey creation UI */}
      {creatingJourney && (
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-3xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-4 flex justify-between items-center">
            <span>選擇照片來建立旅程</span>
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs">已選 {journeyPhotoIds.size} 張</span>
          </p>
          <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-700">
            {memoryPhotosForJourney.map(photo => (
              <button
                key={photo.id}
                onClick={() => toggleJourneyPhoto(photo.id)}
                className={`aspect-square rounded-xl overflow-hidden border-2 relative transition-all ${
                  journeyPhotoIds.has(photo.id) ? 'border-emerald-400 scale-95' : 'border-transparent hover:opacity-80'
                }`}
              >
                <img src={photo.thumbnail} alt="" className="w-full h-full object-cover" />
                {journeyPhotoIds.has(photo.id) && (
                  <div className="absolute inset-0 bg-emerald-500/40 backdrop-blur-[2px] flex items-center justify-center">
                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {journeyPhotoIds.size >= 2 && (
            <button
              onClick={handleCreateManual}
              className="w-full mt-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-md transition-all active:scale-95"
            >
              建立旅程（{journeyPhotoIds.size} 張照片）
            </button>
          )}
        </div>
      )}

      {/* Journey List */}
      {journeys.length > 0 ? (
        <div className="space-y-4">
          {journeys.map(journey => {
            const journeyPhotos = photos.filter(p => journey.photoIds.includes(p.id));
            const coverPhoto = journeyPhotos.find(p => p.id === journey.coverPhotoId) || journeyPhotos[0];
            return (
              <button
                key={journey.id}
                onClick={() => setActiveJourney(journey)}
                className="w-full bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 overflow-hidden text-left shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="relative h-48">
                  {coverPhoto ? (
                    <img src={coverPhoto.fullImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <Map className="w-8 h-8 text-neutral-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-black text-xl truncate drop-shadow-md">{journey.name}</h3>
                    <div className="flex items-center gap-2 text-white/90 text-xs font-medium mt-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{formatDateRange(journey.startDate, journey.endDate)}</span>
                      {journey.location && (
                        <>
                          <span className="opacity-50">·</span>
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{journey.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {journey.aiGenerated && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold">
                      <Sparkles className="w-3 h-3 text-violet-300" />
                      AI 生成
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between bg-white dark:bg-neutral-900">
                  <div className="flex -space-x-3">
                    {journeyPhotos.slice(0, 5).map(p => (
                      <img key={p.id} src={p.thumbnail} alt="" className="w-9 h-9 rounded-full border-[3px] border-white dark:border-neutral-900 object-cover shadow-sm" />
                    ))}
                    {journeyPhotos.length > 5 && (
                      <span className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 border-[3px] border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-bold text-neutral-500 shadow-sm z-10">
                        +{journeyPhotos.length - 5}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-neutral-400 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
                    {journeyPhotos.length} 張照片
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 text-neutral-400">
          <Compass className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-base font-bold dark:text-neutral-300">還沒有旅程</p>
          <p className="text-sm mt-1">上傳回憶照後，點「自動偵測旅程」</p>
        </div>
      )}
    </div>
  );
};
