// NovaCastTacklebox.jsx
// Upgraded tacklebox with:
//   - Memory Cards: "at Lake X with Y lure in May I caught big bass"
//   - Wishlist: gear to buy or look up later
//   - Saved lures/colors from recommendations (existing behavior)
//   - All stored in localStorage

import { useState } from 'react';
import { Heart, Plus, Trash2, X, ChevronLeft, Star, ShoppingBag, BookOpen, Fish } from 'lucide-react';

const STORAGE_KEY = 'novacast_tacklebox_v2';

function loadStorage() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : { lures: [], colors: [], walmart: [], memories: [], wishlist: [] };
  } catch {
    return { lures: [], colors: [], walmart: [], memories: [], wishlist: [] };
  }
}

function saveStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function NovaCastTacklebox({ onBack, externalTacklebox, onToggleSaved }) {
  // If externalTacklebox is provided (from App.tsx), use that. Otherwise use local storage.
  const [box, setBox] = useState(() => {
    if (externalTacklebox) return { ...loadStorage(), ...externalTacklebox };
    return loadStorage();
  });

  const [activeTab, setActiveTab] = useState('saved');
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [showWishForm, setShowWishForm] = useState(false);

  // Memory card form state
  const [memForm, setMemForm] = useState({ lake: '', lure: '', month: '', species: '', note: '' });
  // Wishlist form state
  const [wishForm, setWishForm] = useState({ item: '', note: '' });

  const update = (fn) => {
    setBox(prev => {
      const next = fn(prev);
      saveStorage(next);
      return next;
    });
  };

  const removeItem = (category, index) => {
    update(prev => ({ ...prev, [category]: prev[category].filter((_, i) => i !== index) }));
  };

  const addMemory = () => {
    if (!memForm.lake && !memForm.lure) return;
    update(prev => ({
      ...prev,
      memories: [...prev.memories, { ...memForm, id: Date.now() }],
    }));
    setMemForm({ lake: '', lure: '', month: '', species: '', note: '' });
    setShowMemoryForm(false);
  };

  const addWish = () => {
    if (!wishForm.item) return;
    update(prev => ({
      ...prev,
      wishlist: [...prev.wishlist, { ...wishForm, id: Date.now(), done: false }],
    }));
    setWishForm({ item: '', note: '' });
    setShowWishForm(false);
  };

  const toggleWishDone = (id) => {
    update(prev => ({
      ...prev,
      wishlist: prev.wishlist.map(w => w.id === id ? { ...w, done: !w.done } : w),
    }));
  };

  const removeMemory = (id) => {
    update(prev => ({ ...prev, memories: prev.memories.filter(m => m.id !== id) }));
  };

  const removeWish = (id) => {
    update(prev => ({ ...prev, wishlist: prev.wishlist.filter(w => w.id !== id) }));
  };

  const TABS = [
    { key: 'saved',    label: '❤️ Saved', count: (box.lures?.length || 0) + (box.colors?.length || 0) + (box.walmart?.length || 0) },
    { key: 'memories', label: '📍 My Spots', count: box.memories?.length || 0 },
    { key: 'wishlist', label: '🛒 Wish List', count: box.wishlist?.length || 0 },
  ];

  const inputStyle = {
    width: '100%', background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '10px',
    color: '#e8f0f8', fontSize: '14px', padding: '10px 14px', outline: 'none',
    marginBottom: '8px', boxSizing: 'border-box',
  };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // ── SAVED TAB ─────────────────────────────────────────────────────────────
  const SavedTab = () => {
    const empty = !box.lures?.length && !box.colors?.length && !box.walmart?.length;
    if (empty) return (
      <div style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '16px', padding: '40px 20px', textAlign: 'center' }}>
        <Heart size={36} color="#1e3a5f" style={{ margin: '0 auto 12px', display: 'block' }} />
        <div style={{ color: '#7a8ea6', fontSize: '14px', marginBottom: '6px' }}>No saved items yet.</div>
        <div style={{ color: '#7a8ea6', fontSize: '12px', lineHeight: '1.5' }}>Tap the heart ♥ on any lure, color, or store item in your Game Plan to save it here.</div>
      </div>
    );

    return (
      <div>
        {box.lures?.length > 0 && (
          <div style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#00e5c7', fontWeight: '600', marginBottom: '10px' }}>Saved Lures</div>
            {box.lures.map((name, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#152a4f', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '10px 14px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{name}</span>
                <button onClick={() => removeItem('lures', i)} style={{ background: 'transparent', border: 'none', color: '#e05c5c', cursor: 'pointer' }}>
                  <Heart size={16} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )}

        {box.colors?.length > 0 && (
          <div style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#00e5c7', fontWeight: '600', marginBottom: '10px' }}>Saved Colors</div>
            {box.colors.map((name, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#152a4f', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '10px 14px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{name}</span>
                <button onClick={() => removeItem('colors', i)} style={{ background: 'transparent', border: 'none', color: '#e05c5c', cursor: 'pointer' }}>
                  <Heart size={16} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )}

        {box.walmart?.length > 0 && (
          <div style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#00e5c7', fontWeight: '600', marginBottom: '10px' }}>Shopping Checklist</div>
            {box.walmart.map((name, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#152a4f', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '10px 14px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{name}</span>
                <button onClick={() => removeItem('walmart', i)} style={{ background: 'transparent', border: 'none', color: '#e05c5c', cursor: 'pointer' }}>
                  <Heart size={16} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── MEMORIES TAB ──────────────────────────────────────────────────────────
  const MemoriesTab = () => (
    <div>
      <div style={{ fontSize: '13px', color: '#7a8ea6', marginBottom: '12px', lineHeight: '1.5' }}>
        Save your best combos. "At Preslar Lake in May with a chatterbait I caught 3 big bass." These are your personal game notes — build them up over time.
      </div>

      {!showMemoryForm ? (
        <button
          onClick={() => setShowMemoryForm(true)}
          style={{ width: '100%', padding: '12px', background: 'rgba(0,229,199,0.08)', border: '1.5px dashed rgba(0,229,199,0.4)', borderRadius: '12px', color: '#00e5c7', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}
        >
          <Plus size={16} /> Add a Memory
        </button>
      ) : (
        <div style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#00e5c7' }}>New Memory</div>
            <button onClick={() => setShowMemoryForm(false)} style={{ background: 'transparent', border: 'none', color: '#7a8ea6', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          <input style={inputStyle} placeholder="Lake or spot name *" value={memForm.lake} onChange={e => setMemForm(s => ({ ...s, lake: e.target.value }))} maxLength={60} />
          <input style={inputStyle} placeholder="Lure or bait used *" value={memForm.lure} onChange={e => setMemForm(s => ({ ...s, lure: e.target.value }))} maxLength={60} />
          <select style={{ ...inputStyle }} value={memForm.month} onChange={e => setMemForm(s => ({ ...s, month: e.target.value }))}>
            <option value="">Month (optional)</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input style={inputStyle} placeholder="Fish caught (optional)" value={memForm.species} onChange={e => setMemForm(s => ({ ...s, species: e.target.value }))} maxLength={60} />
          <textarea
            style={{ ...inputStyle, resize: 'none', height: '72px' }}
            placeholder="Notes — conditions, where exactly, anything you want to remember"
            value={memForm.note}
            onChange={e => setMemForm(s => ({ ...s, note: e.target.value }))}
            maxLength={300}
          />
          <button
            onClick={addMemory}
            disabled={!memForm.lake && !memForm.lure}
            style={{ width: '100%', padding: '12px', background: memForm.lake || memForm.lure ? '#00e5c7' : '#1e3a5f', color: memForm.lake || memForm.lure ? '#0a1628' : '#7a8ea6', fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', letterSpacing: '2px', borderRadius: '10px', border: 'none', cursor: memForm.lake || memForm.lure ? 'pointer' : 'default' }}
          >
            SAVE MEMORY
          </button>
        </div>
      )}

      {box.memories?.length === 0 && !showMemoryForm && (
        <div style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '30px 20px', textAlign: 'center' }}>
          <Fish size={32} color="#1e3a5f" style={{ margin: '0 auto 10px', display: 'block' }} />
          <div style={{ color: '#7a8ea6', fontSize: '13px' }}>No memories saved yet. Add your first one above.</div>
        </div>
      )}

      {box.memories?.map(m => (
        <div key={m.id} style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '14px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#e8f0f8', marginBottom: '2px' }}>{m.lake || 'Unknown spot'}</div>
              <div style={{ fontSize: '12px', color: '#00e5c7', marginBottom: '4px' }}>
                {[m.lure, m.species, m.month].filter(Boolean).join(' · ')}
              </div>
              {m.note && <div style={{ fontSize: '12px', color: '#7a8ea6', lineHeight: '1.5' }}>{m.note}</div>}
            </div>
            <button onClick={() => removeMemory(m.id)} style={{ background: 'transparent', border: 'none', color: '#7a8ea6', cursor: 'pointer', marginLeft: '8px', flexShrink: 0 }}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // ── WISHLIST TAB ──────────────────────────────────────────────────────────
  const WishlistTab = () => (
    <div>
      <div style={{ fontSize: '13px', color: '#7a8ea6', marginBottom: '12px', lineHeight: '1.5' }}>
        Gear you want to buy, lures to look up, things to try next trip. Check them off when you get them.
      </div>

      {!showWishForm ? (
        <button
          onClick={() => setShowWishForm(true)}
          style={{ width: '100%', padding: '12px', background: 'rgba(0,229,199,0.08)', border: '1.5px dashed rgba(0,229,199,0.4)', borderRadius: '12px', color: '#00e5c7', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}
        >
          <Plus size={16} /> Add to Wish List
        </button>
      ) : (
        <div style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#00e5c7' }}>New Item</div>
            <button onClick={() => setShowWishForm(false)} style={{ background: 'transparent', border: 'none', color: '#7a8ea6', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          <input style={inputStyle} placeholder="Item name *" value={wishForm.item} onChange={e => setWishForm(s => ({ ...s, item: e.target.value }))} maxLength={80} />
          <input style={inputStyle} placeholder="Note — price, where to get it, why you want it" value={wishForm.note} onChange={e => setWishForm(s => ({ ...s, note: e.target.value }))} maxLength={200} />
          <button
            onClick={addWish}
            disabled={!wishForm.item}
            style={{ width: '100%', padding: '12px', background: wishForm.item ? '#00e5c7' : '#1e3a5f', color: wishForm.item ? '#0a1628' : '#7a8ea6', fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', letterSpacing: '2px', borderRadius: '10px', border: 'none', cursor: wishForm.item ? 'pointer' : 'default' }}
          >
            ADD TO LIST
          </button>
        </div>
      )}

      {box.wishlist?.length === 0 && !showWishForm && (
        <div style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '30px 20px', textAlign: 'center' }}>
          <ShoppingBag size={32} color="#1e3a5f" style={{ margin: '0 auto 10px', display: 'block' }} />
          <div style={{ color: '#7a8ea6', fontSize: '13px' }}>Nothing on your wish list yet.</div>
        </div>
      )}

      {box.wishlist?.filter(w => !w.done).length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          {box.wishlist.filter(w => !w.done).map(w => (
            <div key={w.id} style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '12px 14px', marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <button
                onClick={() => toggleWishDone(w.id)}
                style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #1e3a5f', background: 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: '1px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#e8f0f8', marginBottom: '2px' }}>{w.item}</div>
                {w.note && <div style={{ fontSize: '12px', color: '#7a8ea6' }}>{w.note}</div>}
              </div>
              <button onClick={() => removeWish(w.id)} style={{ background: 'transparent', border: 'none', color: '#7a8ea6', cursor: 'pointer', flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {box.wishlist?.filter(w => w.done).length > 0 && (
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7a8ea6', fontWeight: '600', marginBottom: '8px', marginTop: '8px' }}>Got It ✓</div>
          {box.wishlist.filter(w => w.done).map(w => (
            <div key={w.id} style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '12px 14px', marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '10px', opacity: 0.5 }}>
              <button
                onClick={() => toggleWishDone(w.id)}
                style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #00e5c7', background: 'rgba(0,229,199,0.2)', cursor: 'pointer', flexShrink: 0, marginTop: '1px', color: '#00e5c7', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✓</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#7a8ea6', textDecoration: 'line-through', marginBottom: '2px' }}>{w.item}</div>
                {w.note && <div style={{ fontSize: '12px', color: '#7a8ea6' }}>{w.note}</div>}
              </div>
              <button onClick={() => removeWish(w.id)} style={{ background: 'transparent', border: 'none', color: '#7a8ea6', cursor: 'pointer', flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#e8f0f8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#00e5c7' }}>My Tacklebox</div>
        {onBack && (
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#7a8ea6', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ChevronLeft size={16} /> Back
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '8px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              border: `1.5px solid ${activeTab === t.key ? '#00e5c7' : '#1e3a5f'}`,
              background: activeTab === t.key ? 'rgba(0,229,199,0.1)' : '#152a4f',
              color: activeTab === t.key ? '#00e5c7' : '#7a8ea6',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{ background: activeTab === t.key ? 'rgba(0,229,199,0.3)' : '#1e3a5f', borderRadius: '999px', padding: '1px 6px', fontSize: '10px', fontWeight: '700' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'saved'    && <SavedTab />}
      {activeTab === 'memories' && <MemoriesTab />}
      {activeTab === 'wishlist' && <WishlistTab />}
    </div>
  );
}
