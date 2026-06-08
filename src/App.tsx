import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Heart, Home as HomeIcon, User, MapPin, Star,
  ChevronRight, Bell, MessageSquare, ArrowLeft, CheckCircle2,
  AlertCircle, Wifi, Wind, Car, Utensils, Shield, Dumbbell,
  Waves, X, HelpCircle, Phone, Building2, LayoutDashboard,
  PlusCircle, TrendingUp, Eye, EyeOff, Lock, Mail, Smartphone,
  Trash2, ClipboardList,
} from 'lucide-react';

/* ══════════════════════════════════════════════
   BRAND TOKENS
══════════════════════════════════════════════ */
const C = {
  primary: '#FFD600', secondary: '#FFE033',
  error: '#E24B4A', success: '#52C41A', warning: '#F59E0B',
  dark: '#1a1a1a', muted: '#888', surface: '#FAFAFA',
};

/* ══════════════════════════════════════════════
   INTERACTION HOOKS
══════════════════════════════════════════════ */
function useLongPress(onLongPress:()=>void, ms=500) {
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const start = () => { timer.current = setTimeout(onLongPress, ms); };
  const cancel = () => { if (timer.current) { clearTimeout(timer.current); timer.current=null; } };
  return { onTouchStart:start, onTouchEnd:cancel, onTouchMove:cancel, onMouseDown:start, onMouseUp:cancel, onMouseLeave:cancel };
}

function usePullToRefresh(onRefresh:()=>void) {
  const startY = useRef(0);
  const [pulling, setPulling] = useState(false);
  const [dist,    setDist]    = useState(0);
  const onTouchStart = (e:React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchMove  = (e:React.TouchEvent) => {
    const d = e.touches[0].clientY - startY.current;
    if (d>0 && (e.currentTarget as HTMLElement).scrollTop===0) { setPulling(true); setDist(Math.min(d,80)); }
  };
  const onTouchEnd = () => {
    if (dist>60) onRefresh();
    setPulling(false); setDist(0);
  };
  return { pulling, dist, handlers:{ onTouchStart, onTouchMove, onTouchEnd } };
}

function useClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = (text:string) => {
    navigator.clipboard?.writeText(text).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };
  return { copy, copied };
}


type UserRole = 'seeker' | 'owner';

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

interface Listing {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  price: number;
  type: 'putra' | 'putri' | 'campur';
  rating: number;
  image: string;
  facilities: string[];
  distanceToCampus: string;
  totalRooms: number;
  occupiedRooms: number;
  description: string;
  createdAt: string;
  // Apartment-specific fields
  isApartment?: boolean;
  unitType?: 'Studio' | '1BR' | '2BR';
  furnished?: 'furnished' | 'unfurnished';
  buildingFacilities?: string[];
}

interface Booking {
  id: string;
  listingId: string;
  seekerId: string;
  ownerId: string;
  listingName: string;
  listingLocation: string;
  listingImage: string;
  seekerName: string;
  seekerPhone: string;
  startDate: string;
  duration: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'done';
  createdAt: string;
}

type Screen = 'splash' | 'login' | 'register';
type View = 'home' | 'favorites' | 'dashboard' | 'profile' | 'detail' | 'booking' | 'add-listing' | 'my-bookings' | 'apartment';

/* ══════════════════════════════════════════════
   SEED DATA
══════════════════════════════════════════════ */
const SEED_LISTINGS: Listing[] = [
  { id:'l1', ownerId:'seed', name:'Kost Exclusive Margonda', location:'Depok, Jawa Barat', price:1500000,
    type:'putra', rating:4.8, image:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600',
    facilities:['WiFi','AC','Parkir'], distanceToCampus:'0.5 km dari UI',
    totalRooms:10, occupiedRooms:7, description:'Kost nyaman dekat UI dengan fasilitas lengkap. AC di setiap kamar, parkir motor dan mobil tersedia.', createdAt:'2026-01-01' },
  { id:'l2', ownerId:'seed', name:'Wisma Putri Telkom', location:'Bandung, Jawa Barat', price:1200000,
    type:'putri', rating:4.5, image:'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=600',
    facilities:['WiFi','Dapur','Keamanan 24 jam'], distanceToCampus:'0.8 km dari Telkom University',
    totalRooms:8, occupiedRooms:7, description:'Kost khusus putri, lingkungan aman dan nyaman. Dapur bersama tersedia.', createdAt:'2026-01-01' },
  { id:'l3', ownerId:'seed', name:'Kost Campur Modern Grogol', location:'Jakarta Barat', price:2100000,
    type:'campur', rating:4.9, image:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=600',
    facilities:['WiFi','AC','Kolam Renang'], distanceToCampus:'1.2 km dari Trisakti',
    totalRooms:12, occupiedRooms:12, description:'Kost modern dengan kolam renang. Sangat dekat Trisakti dan Untar.', createdAt:'2026-01-01' },
  { id:'l4', ownerId:'seed', name:'Apartemen Student Choice', location:'Surabaya, Jawa Timur', price:3500000,
    type:'campur', rating:4.7, image:'https://images.unsplash.com/photo-1512918766671-56f0b17132d6?auto=format&fit=crop&q=80&w=600',
    facilities:['WiFi','Gym','Parkir'], distanceToCampus:'0.3 km dari ITS',
    totalRooms:20, occupiedRooms:15, description:'Apartemen studio premium paling dekat ITS. Dilengkapi gym dan area parkir luas.', createdAt:'2026-01-01' },
  { id:'l5', ownerId:'seed', name:'Kost Putri Cendana', location:'Yogyakarta', price:900000,
    type:'putri', rating:4.6, image:'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600',
    facilities:['WiFi','Dapur'], distanceToCampus:'0.4 km dari UGM',
    totalRooms:6, occupiedRooms:2, description:'Kost putri paling terjangkau dekat UGM. Suasana tenang dan asri.', createdAt:'2026-01-01' },
];

const SEED_APARTMENTS: Listing[] = [
  { id:'a1', ownerId:'seed', name:'Puri Mansion Residence', location:'Jakarta Selatan', price:4500000,
    type:'campur', rating:4.9, image:'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800',
    facilities:['WiFi','AC','Parkir','Gym'], distanceToCampus:'1.0 km dari Binus',
    totalRooms:40, occupiedRooms:32, description:'Apartemen premium di pusat Jakarta Selatan. Unit studio modern dengan view kota. Gedung dilengkapi gym dan kolam renang rooftop.',
    createdAt:'2026-01-01', isApartment:true, unitType:'Studio', furnished:'furnished',
    buildingFacilities:['Kolam Renang','Gym','Parkir','Keamanan 24 jam'] },
  { id:'a2', ownerId:'seed', name:'Green Park Apartment', location:'Bandung, Jawa Barat', price:5800000,
    type:'campur', rating:4.7, image:'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800',
    facilities:['WiFi','AC','Parkir','Kolam Renang'], distanceToCampus:'0.7 km dari ITB',
    totalRooms:30, occupiedRooms:18, description:'Apartemen 1BR nyaman dekat ITB Bandung. Fully furnished, view gunung Bandung. Cocok untuk pasangan atau profesional muda.',
    createdAt:'2026-01-01', isApartment:true, unitType:'1BR', furnished:'furnished',
    buildingFacilities:['Kolam Renang','Parkir','Keamanan 24 jam'] },
  { id:'a3', ownerId:'seed', name:'Surabaya Sky Residence', location:'Surabaya, Jawa Timur', price:7200000,
    type:'campur', rating:4.8, image:'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&q=80&w=800',
    facilities:['WiFi','AC','Gym','Parkir'], distanceToCampus:'0.5 km dari ITS',
    totalRooms:24, occupiedRooms:20, description:'Unit 2BR luas di gedung premium Surabaya. Unfurnished, cocok untuk keluarga muda. Fasilitas gedung lengkap termasuk gym dan ballroom.',
    createdAt:'2026-01-01', isApartment:true, unitType:'2BR', furnished:'unfurnished',
    buildingFacilities:['Gym','Parkir','Keamanan 24 jam'] },
  { id:'a4', ownerId:'seed', name:'Jogja Urban Studio', location:'Yogyakarta', price:2800000,
    type:'campur', rating:4.5, image:'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&q=80&w=800',
    facilities:['WiFi','AC','Dapur'], distanceToCampus:'0.6 km dari UGM',
    totalRooms:20, occupiedRooms:14, description:'Studio modern dan terjangkau di Jogja, dekat UGM. Semi-furnished dengan dapur kecil. Lokasi strategis dekat pusat kota.',
    createdAt:'2026-01-01', isApartment:true, unitType:'Studio', furnished:'unfurnished',
    buildingFacilities:['Parkir','Keamanan 24 jam'] },
];

const CAMPUSES = ['UI','ITB','UGM','ITS','Telkom University','Binus','UPH'];
const ALL_FACILITIES = ['WiFi','AC','Parkir','Dapur','Gym','Kolam Renang','Keamanan 24 jam'];

/* ══════════════════════════════════════════════
   DATABASE (localStorage)
══════════════════════════════════════════════ */
const DB = {
  getUsers: (): AppUser[] => { try { return JSON.parse(localStorage.getItem('pk_users') || '[]'); } catch { return []; } },
  saveUsers: (u: AppUser[]) => localStorage.setItem('pk_users', JSON.stringify(u)),
  findUser: (emailOrPhone: string, password: string) =>
    DB.getUsers().find(u => (u.email === emailOrPhone.trim() || u.phone === emailOrPhone.trim()) && u.password === password),
  emailExists: (email: string) => DB.getUsers().some(u => u.email === email.trim()),
  createUser: (data: Omit<AppUser,'id'|'createdAt'>): AppUser => {
    const user: AppUser = { ...data, id: `u_${Date.now()}`, createdAt: new Date().toISOString() };
    DB.saveUsers([...DB.getUsers(), user]);
    return user;
  },
  updateUser: (id: string, patch: Partial<AppUser>) => {
    DB.saveUsers(DB.getUsers().map(u => u.id === id ? { ...u, ...patch } : u));
    return DB.getUsers().find(u => u.id === id)!;
  },

  getSession: (): AppUser | null => { try { return JSON.parse(localStorage.getItem('pk_session') || 'null'); } catch { return null; } },
  saveSession: (u: AppUser) => localStorage.setItem('pk_session', JSON.stringify(u)),
  clearSession: () => localStorage.removeItem('pk_session'),

  getListings: (): Listing[] => {
    try {
      const s = localStorage.getItem('pk_listings');
      if (!s) { localStorage.setItem('pk_listings', JSON.stringify([...SEED_LISTINGS,...SEED_APARTMENTS])); return [...SEED_LISTINGS,...SEED_APARTMENTS]; }
      return JSON.parse(s);
    } catch { return SEED_LISTINGS; }
  },
  saveListings: (l: Listing[]) => localStorage.setItem('pk_listings', JSON.stringify(l)),
  addListing: (l: Omit<Listing,'id'|'createdAt'|'rating'>): Listing => {
    const listing: Listing = { ...l, id: `l_${Date.now()}`, rating: 0, createdAt: new Date().toISOString() };
    DB.saveListings([...DB.getListings(), listing]);
    return listing;
  },
  updateListing: (id: string, patch: Partial<Listing>) =>
    DB.saveListings(DB.getListings().map(l => l.id === id ? { ...l, ...patch } : l)),
  deleteListing: (id: string) => DB.saveListings(DB.getListings().filter(l => l.id !== id)),
  getOwnerListings: (ownerId: string) => DB.getListings().filter(l => l.ownerId === ownerId),

  getBookings: (): Booking[] => { try { return JSON.parse(localStorage.getItem('pk_bookings') || '[]'); } catch { return []; } },
  saveBookings: (b: Booking[]) => localStorage.setItem('pk_bookings', JSON.stringify(b)),
  addBooking: (b: Omit<Booking,'id'|'createdAt'>): Booking => {
    const booking: Booking = { ...b, id: `b_${Date.now()}`, createdAt: new Date().toISOString() };
    DB.saveBookings([...DB.getBookings(), booking]);
    const listing = DB.getListings().find(l => l.id === b.listingId);
    if (listing) DB.updateListing(b.listingId, { occupiedRooms: Math.min(listing.totalRooms, listing.occupiedRooms + 1) });
    return booking;
  },
  updateBookingStatus: (id: string, status: Booking['status']) =>
    DB.saveBookings(DB.getBookings().map(b => b.id === id ? { ...b, status } : b)),
  getSeekerBookings: (seekerId: string) => DB.getBookings().filter(b => b.seekerId === seekerId),
  getOwnerBookings: (ownerId: string) => DB.getBookings().filter(b => b.ownerId === ownerId),

  getFavs: (): Record<string,string[]> => { try { return JSON.parse(localStorage.getItem('pk_favs') || '{}'); } catch { return {}; } },
  saveFavs: (f: Record<string,string[]>) => localStorage.setItem('pk_favs', JSON.stringify(f)),
  getUserFavs: (userId: string) => DB.getFavs()[userId] || [],
  toggleFav: (userId: string, listingId: string): string[] => {
    const all = DB.getFavs();
    const cur = all[userId] || [];
    all[userId] = cur.includes(listingId) ? cur.filter(x => x !== listingId) : [...cur, listingId];
    DB.saveFavs(all);
    return all[userId];
  },
};

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(n);
const avail = (l: Listing) => Math.max(0, l.totalRooms - l.occupiedRooms);
const roomStatus = (n: number) => {
  if (n === 0) return { text:'Kamar penuh – Daftarkan untuk notifikasi', color: C.error };
  if (n === 1) return { text:'Hampir penuh – Hanya tersisa 1 kamar!', color: C.warning };
  return { text:`Sisa ${n} kamar kosong – Segera booking!`, color: C.success };
};
const BOOKING_LABEL: Record<Booking['status'],{label:string;color:string}> = {
  pending:   { label:'Menunggu Konfirmasi', color: C.warning },
  confirmed: { label:'Dikonfirmasi ✓',     color: C.success },
  rejected:  { label:'Ditolak',            color: C.error   },
  done:      { label:'Selesai',            color: C.muted   },
};
const FACI_ICON: Record<string, React.ReactNode> = {
  WiFi:<Wifi size={11}/>, AC:<Wind size={11}/>, Parkir:<Car size={11}/>,
  Dapur:<Utensils size={11}/>, Gym:<Dumbbell size={11}/>,
  'Kolam Renang':<Waves size={11}/>, 'Keamanan 24 jam':<Shield size={11}/>,
};

/* ══════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════ */
const sk: React.CSSProperties = {
  background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
  backgroundSize:'200% 100%', animation:'sk 1.5s infinite',
};
function SkeletonCard() {
  return (
    <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.05)' }}>
      <div style={{ height:172, ...sk }} />
      <div style={{ padding:14, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ height:14, ...sk, borderRadius:8, width:'70%' }} />
        <div style={{ height:11, ...sk, borderRadius:8, width:'50%' }} />
        <div style={{ height:32, ...sk, borderRadius:10, marginTop:4 }} />
      </div>
    </div>
  );
}

function FieldErr({ msg }:{ msg?:string }) {
  if (!msg) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
      <AlertCircle size={12} style={{ color:C.error, flexShrink:0 }}/>
      <span style={{ fontSize:11, color:C.error }}>{msg}</span>
    </div>
  );
}

function TextInput({ label, placeholder, value, onChange, type='text', error, icon, rightEl }:{
  label?:string; placeholder?:string; value:string;
  onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void;
  type?:string; error?:string; icon?:React.ReactNode; rightEl?:React.ReactNode;
}) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#555',
        marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>}
      <div style={{ position:'relative' }}>
        {icon && <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
          color: error ? C.error : C.muted }}>{icon}</div>}
        <input type={type} value={value} placeholder={placeholder} onChange={onChange}
          style={{ width:'100%', boxSizing:'border-box',
            paddingLeft: icon ? 42 : 16, paddingRight: rightEl ? 44 : 16,
            paddingTop:14, paddingBottom:14, borderRadius:10,
            border: error ? `2px solid ${C.error}` : '1.5px solid #e0e0e0',
            fontSize:13, outline:'none', color:C.dark,
            background: error ? '#fff5f5' : '#fafafa', transition:'border .15s' }} />
        {rightEl && <div style={{ position:'absolute', right:14, top:'50%',
          transform:'translateY(-50%)' }}>{rightEl}</div>}
      </div>
      <FieldErr msg={error} />
    </div>
  );
}

function RoleRadio({ value, onChange }:{ value:UserRole; onChange:(r:UserRole)=>void }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#555', marginBottom:8,
        textTransform:'uppercase', letterSpacing:.5 }}>Saya adalah</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {([{val:'seeker' as UserRole, label:'🔍 Pencari Kost', desc:'Saya ingin mencari kost'},
           {val:'owner'  as UserRole, label:'🏘️ Pemilik Kost',  desc:'Saya ingin mengelola properti'}]
        ).map(opt => (
          <div key={opt.val} onClick={()=>onChange(opt.val)} style={{
            display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12,
            cursor:'pointer', transition:'all .15s',
            border: value===opt.val ? `2px solid ${C.primary}` : '1.5px solid #e8e8e8',
            background: value===opt.val ? `${C.primary}15` : '#fafafa',
          }}>
            <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, transition:'all .15s',
              border: value===opt.val ? `5px solid ${C.primary}` : '2px solid #ccc',
              background: value===opt.val ? C.primary : '#fff' }} />
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.dark }}>{opt.label}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{opt.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavBtn({ active, icon, label, onClick }:{
  active:boolean; icon:React.ReactNode; label:string; onClick:()=>void;
}) {
  return (
    <button onClick={onClick} style={{ display:'flex', flexDirection:'column', alignItems:'center',
      gap:2, border:'none', background:'none', cursor:'pointer', padding:'4px 12px' }}>
      <div style={{ color: active ? C.primary : '#bbb' }}>{icon}</div>
      <span style={{ fontSize:10, fontWeight:600, color: active ? C.primary : '#bbb' }}>{label}</span>
    </button>
  );
}

/* ══════════════════════════════════════════════
   KOST CARD
══════════════════════════════════════════════ */
function KostCard({ l, isFav, onFav, onClick }:{
  l:Listing; isFav:boolean; onFav:(id:string)=>void; onClick:(l:Listing)=>void;
}) {
  const n = avail(l);
  const st = roomStatus(n);
  const fallback = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600';
  const [sheet, setSheet] = useState(false);
  const lp = useLongPress(()=>setSheet(true));
  return (
    <>
    <div {...lp} onClick={()=>onClick(l)} style={{ background:'#fff', borderRadius:14, overflow:'hidden',
      boxShadow:'0 4px 20px rgba(0,0,0,.05)', cursor:'pointer', userSelect:'none' }}>
      <div style={{ position:'relative' }}>
        <img src={l.image||fallback} alt={l.name}
          onError={e=>{(e.target as HTMLImageElement).src=fallback;}}
          style={{ width:'100%', height:172, objectFit:'cover', display:'block' }}/>
        <button onClick={e=>{e.stopPropagation();onFav(l.id);}}
          style={{ position:'absolute', top:10, right:10, background:'#fff', border:'none',
            borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center',
            justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,.15)' }}>
          <Heart size={15} style={{ fill:isFav?C.error:'none', color:isFav?C.error:'#ccc' }}/>
        </button>
        <span style={{ position:'absolute', top:10, left:10, background:C.primary, color:C.dark,
          fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:20, textTransform:'uppercase' }}>
          {l.type}
        </span>
      </div>
      <div style={{ padding:'12px 14px 14px', display:'flex', flexDirection:'column', gap:4 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <span style={{ fontWeight:700, fontSize:13, color:C.dark, flex:1, paddingRight:8 }}>{l.name}</span>
          {l.rating>0 && <span style={{ display:'flex', alignItems:'center', gap:3 }}>
            <Star size={12} style={{ fill:C.primary, color:C.primary }}/>
            <span style={{ fontSize:12, fontWeight:700 }}>{l.rating.toFixed(1)}</span>
          </span>}
        </div>
        <span style={{ display:'flex', alignItems:'center', gap:4, color:'#555', fontSize:12 }}>
          <MapPin size={11}/>{l.location}
        </span>
        {l.distanceToCampus && <span style={{ fontSize:12, fontWeight:600, color:C.primary }}>🎓 {l.distanceToCampus}</span>}
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
          {l.facilities.slice(0,3).map(f=>(
            <span key={f} style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px',
              background:'#f5f5f5', borderRadius:20, fontSize:11, color:'#555' }}>
              {FACI_ICON[f]??null}{f}
            </span>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          marginTop:8, paddingTop:8, borderTop:'1px solid #f0f0f0' }}>
          <div>
            <span style={{ fontWeight:800, fontSize:14, color:C.dark }}>{rupiah(l.price)}</span>
            <span style={{ fontSize:10, color:C.muted }}>/bulan</span>
          </div>
          <span style={{ fontSize:10, fontWeight:600, color:st.color, textAlign:'right', maxWidth:'55%' }}>{st.text}</span>
        </div>
      </div>
    </div>

    {/* Long Press Quick Action Sheet */}
    {sheet && (
      <div style={{ position:'fixed', inset:0, zIndex:300 }}>
        <div onClick={()=>setSheet(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)' }}/>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'#fff',
          borderRadius:'20px 20px 0 0', padding:'0 20px 40px' }}>
          <div style={{ width:40, height:4, borderRadius:4, background:'#e0e0e0', margin:'12px auto 16px' }}/>
          <div style={{ fontSize:14, fontWeight:800, color:C.dark, marginBottom:4 }}>{l.name}</div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:20 }}>{l.location}</div>
          {[
            { icon:'❤️', label: isFav?'Hapus dari Favorit':'Simpan ke Favorit', action:()=>{ onFav(l.id); setSheet(false); }, color:isFav?C.error:C.dark },
            { icon:'📞', label:'Hubungi Pemilik via WA', action:()=>{ window.open(`https://wa.me/628123456789?text=Halo, saya tertarik dengan ${l.name}`); setSheet(false); }, color:C.success },
            { icon:'🔗', label:'Salin Link Listing', action:()=>{ navigator.clipboard?.writeText(`PapiKost – ${l.name} @ ${l.location}`).catch(()=>{}); setSheet(false); }, color:C.dark },
          ].map(a=>(
            <button key={a.label} onClick={a.action} style={{ width:'100%', display:'flex', alignItems:'center',
              gap:14, padding:'14px 0', border:'none', borderBottom:'1px solid #f5f5f5', background:'none',
              cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontSize:20 }}>{a.icon}</span>
              <span style={{ fontSize:14, fontWeight:600, color:a.color }}>{a.label}</span>
            </button>
          ))}
          <button onClick={()=>setSheet(false)} style={{ width:'100%', marginTop:12, padding:'13px',
            borderRadius:14, border:'none', background:'#f5f5f5', color:C.muted,
            fontSize:13, fontWeight:700, cursor:'pointer' }}>Batal</button>
        </div>
      </div>
    )}
    </>
  );
}

/* ══════════════════════════════════════════════
   SPLASH
══════════════════════════════════════════════ */
function SplashScreen({ onDone }:{ onDone:()=>void }) {
  useEffect(()=>{ const t=setTimeout(onDone,1800); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{ minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', background:`linear-gradient(160deg,${C.primary} 0%,${C.secondary} 60%,#fff 100%)`,
      padding:24, textAlign:'center' }}>
      <div style={{ width:100, height:100, borderRadius:28, background:'rgba(255,255,255,.3)',
        backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center',
        marginBottom:24, fontSize:44, boxShadow:`0 12px 40px ${C.primary}60`,
        animation:'popIn .6s cubic-bezier(.34,1.56,.64,1)' }}>🏠</div>
      <h1 style={{ fontSize:34, fontWeight:900, color:C.dark, margin:'0 0 8px', letterSpacing:-1 }}>PapiKost</h1>
      <p style={{ fontSize:13, color:'rgba(26,26,26,.65)', margin:'0 0 48px', lineHeight:1.6 }}>
        Agen properti digital 24 jam dalam genggamanmu
      </p>
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{ width:8, height:8, borderRadius:'50%',
            background:'rgba(26,26,26,.3)', animation:`pulse 1.2s ${i*.2}s infinite` }}/>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════ */
function LoginScreen({ onLogin, onGoRegister }:{
  onLogin:(u:AppUser)=>void; onGoRegister:()=>void;
}) {
  const [cred, setCred]   = useState('');
  const [pass, setPass]   = useState('');
  const [show, setShow]   = useState(false);
  const [err,  setErr]    = useState<Record<string,string>>({});
  const [busy, setBusy]   = useState(false);

  const submit = () => {
    const e: Record<string,string> = {};
    if (!cred.trim()) e.cred = 'Email atau nomor HP wajib diisi';
    if (!pass)        e.pass = 'Password wajib diisi';
    else if (pass.length < 8) e.pass = 'Password minimal 8 karakter';
    if (Object.keys(e).length) { setErr(e); return; }
    setBusy(true);
    setTimeout(()=>{
      const user = DB.findUser(cred, pass);
      if (!user) { setErr({ pass:'Email/HP atau password salah. Periksa kembali.' }); setBusy(false); return; }
      DB.saveSession(user);
      setBusy(false);
      onLogin(user);
    }, 700);
  };

  return (
    <div style={{ minHeight:'100%', background:'#fff', display:'flex', flexDirection:'column' }}>
      <div style={{ background:`linear-gradient(135deg,${C.primary} 0%,${C.secondary} 100%)`,
        padding:'56px 24px 40px', borderBottomLeftRadius:32, borderBottomRightRadius:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,.35)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🏠</div>
          <span style={{ fontSize:22, fontWeight:900, color:C.dark, letterSpacing:-.5 }}>PapiKost</span>
        </div>
        <p style={{ fontSize:13, color:'rgba(26,26,26,.65)', marginTop:8, marginBottom:0 }}>
          Masuk ke akun kamu
        </p>
      </div>

      <div style={{ flex:1, padding:'28px 24px 32px', overflowY:'auto' }}>
        <TextInput label="Email / Nomor HP" placeholder="contoh@email.com atau 0812xxxxxxxx"
          value={cred} onChange={e=>{ setCred(e.target.value); setErr(r=>({...r,cred:''})); }}
          error={err.cred} icon={<Mail size={16}/>}/>

        <TextInput label="Password" placeholder="Minimal 8 karakter"
          value={pass} onChange={e=>{ setPass(e.target.value); setErr(r=>({...r,pass:''})); }}
          type={show?'text':'password'} error={err.pass} icon={<Lock size={16}/>}
          rightEl={
            <button onClick={()=>setShow(s=>!s)}
              style={{ border:'none', background:'none', cursor:'pointer', color:C.muted, display:'flex', alignItems:'center' }}>
              {show?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          }/>

        <div style={{ textAlign:'right', marginBottom:24, marginTop:-6 }}>
          <span style={{ fontSize:12, color:C.primary, fontWeight:700, cursor:'pointer' }}>Lupa password?</span>
        </div>

        <button onClick={submit} disabled={busy}
          style={{ width:'100%', padding:'16px', borderRadius:20, border:'none',
            background: busy?'#f0d000':C.primary, color:C.dark, fontSize:14, fontWeight:800,
            cursor:'pointer', boxShadow:`0 8px 24px ${C.primary}60`, opacity: busy?.8:1 }}>
          {busy ? 'Masuk...' : 'MASUK'}
        </button>

        <div style={{ textAlign:'center', marginTop:24 }}>
          <span style={{ fontSize:13, color:C.muted }}>Belum punya akun? </span>
          <span onClick={onGoRegister} style={{ fontSize:13, fontWeight:700, color:C.dark,
            cursor:'pointer', textDecoration:'underline', textDecorationColor:C.primary }}>
            Daftar Sekarang
          </span>
        </div>

        <div style={{ marginTop:20, background:'#f5f5f5', borderRadius:12, padding:'12px 14px',
          fontSize:11, color:C.muted, lineHeight:1.6 }}>
          💡 Data tersimpan di browser ini. Daftar dulu jika belum punya akun.
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   REGISTER
══════════════════════════════════════════════ */
function RegisterScreen({ onRegister, onGoLogin }:{
  onRegister:(u:AppUser)=>void; onGoLogin:()=>void;
}) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'' });
  const [show, setShow] = useState(false);
  const [err,  setErr]  = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e:React.ChangeEvent<HTMLInputElement>) => {
    setForm(f=>({...f,[k]:e.target.value})); setErr(r=>({...r,[k]:''}));
  };

  const submit = () => {
    const e: Record<string,string> = {};
    if (!form.name.trim()) e.name = 'Nama lengkap wajib diisi sesuai KTP';
    if (!form.email.trim()) e.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Format email tidak valid';
    else if (DB.emailExists(form.email)) e.email = 'Email sudah terdaftar, silakan login';
    if (!form.phone.trim()) e.phone = 'Nomor HP wajib diisi';
    else if (!/^08\d{8,11}$/.test(form.phone.trim())) e.phone = 'Format tidak valid (cth: 08xx-xxxx-xxxx)';
    if (!form.password) e.password = 'Password wajib diisi';
    else if (form.password.length < 8) e.password = 'Password minimal 8 karakter';
    if (Object.keys(e).length) { setErr(e); return; }

    setBusy(true);
    setTimeout(()=>{
      const user = DB.createUser({ name:form.name.trim(), email:form.email.trim(),
        phone:form.phone.trim(), password:form.password, role:'seeker' });
      DB.saveSession(user);
      setBusy(false);
      onRegister(user);
    }, 900);
  };

  return (
    <div style={{ minHeight:'100%', background:'#fff', display:'flex', flexDirection:'column' }}>
      <div style={{ background:`linear-gradient(135deg,${C.primary} 0%,${C.secondary} 100%)`,
        padding:'52px 24px 28px', borderBottomLeftRadius:32, borderBottomRightRadius:32 }}>
        <button onClick={onGoLogin} style={{ width:36, height:36, borderRadius:12,
          background:'rgba(255,255,255,.35)', border:'none', display:'flex', alignItems:'center',
          justifyContent:'center', cursor:'pointer', marginBottom:14 }}>
          <ArrowLeft size={18} style={{ color:C.dark }}/>
        </button>
        <h2 style={{ fontSize:22, fontWeight:900, color:C.dark, margin:'0 0 4px' }}>Buat Akun Baru</h2>
        <p style={{ fontSize:13, color:'rgba(26,26,26,.65)', margin:0 }}>Bergabung dan temukan kost impianmu</p>
      </div>

      <div style={{ flex:1, padding:'24px 24px 32px', overflowY:'auto' }}>
        <TextInput label="Nama Lengkap" placeholder="Nama sesuai KTP (cth: Budi Santoso)"
          value={form.name} onChange={set('name')} error={err.name} icon={<User size={16}/>}/>
        <TextInput label="Email" placeholder="nama@email.com"
          value={form.email} onChange={set('email')} type="email" error={err.email} icon={<Mail size={16}/>}/>
        <TextInput label="Nomor HP (WhatsApp Aktif)" placeholder="08xx-xxxx-xxxx"
          value={form.phone} onChange={set('phone')} type="tel" error={err.phone} icon={<Smartphone size={16}/>}/>
        <TextInput label="Password" placeholder="Minimal 8 karakter"
          value={form.password} onChange={set('password')} type={show?'text':'password'}
          error={err.password} icon={<Lock size={16}/>}
          rightEl={
            <button onClick={()=>setShow(s=>!s)}
              style={{ border:'none', background:'none', cursor:'pointer', color:C.muted, display:'flex', alignItems:'center' }}>
              {show?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          }/>

        {form.password.length > 0 && (
          <div style={{ marginBottom:16, marginTop:-8 }}>
            <div style={{ display:'flex', gap:4, marginBottom:4 }}>
              {[1,2,3].map(i=>(
                <div key={i} style={{ flex:1, height:3, borderRadius:4, transition:'background .2s',
                  background: form.password.length>=i*4
                    ? i===1?C.error:i===2?C.warning:C.success : '#e0e0e0' }}/>
              ))}
            </div>
            <span style={{ fontSize:10, color:C.muted }}>
              {form.password.length<4?'Terlalu lemah':form.password.length<8?'Cukup':'Kuat ✓'}
            </span>
          </div>
        )}

        <div style={{ background:'#fffbea', border:'1.5px solid #ffe066', borderRadius:12,
          padding:'10px 14px', marginBottom:18, fontSize:11, color:'#7a5c00', lineHeight:1.6 }}>
          🏠 Ingin iklankan properti kamu? Bisa diaktifkan nanti dari halaman <b>Profil</b>.
        </div>

        <button onClick={submit} disabled={busy}
          style={{ width:'100%', padding:'16px', borderRadius:20, border:'none',
            background: busy?'#f0d000':C.primary, color:C.dark, fontSize:14, fontWeight:800,
            cursor:'pointer', boxShadow:`0 8px 24px ${C.primary}60`, opacity: busy?.8:1 }}>
          {busy ? 'Membuat Akun...' : 'DAFTAR SEKARANG'}
        </button>

        <div style={{ textAlign:'center', marginTop:20 }}>
          <span style={{ fontSize:13, color:C.muted }}>Sudah punya akun? </span>
          <span onClick={onGoLogin} style={{ fontSize:13, fontWeight:700, color:C.dark,
            cursor:'pointer', textDecoration:'underline', textDecorationColor:C.primary }}>Masuk</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOME
══════════════════════════════════════════════ */
function HomeView({ user, onListingClick, favorites, onFav, refresh, onGoApartment }:{
  user:AppUser; onListingClick:(l:Listing)=>void;
  favorites:string[]; onFav:(id:string)=>void; refresh:number;
  onGoApartment:()=>void;
}) {
  const [query,  setQuery]  = useState('');
  const [campus, setCampus] = useState<string|null>(null);
  const [type,   setType]   = useState<string|null>(null);
  const [loading,setLoading]= useState(true);
  const [list,   setList]   = useState<Listing[]>([]);
  const [sheet,  setSheet]  = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000000);
  const [facFilter, setFacFilter] = useState<string[]>([]);
  const toggleFac = (f:string) => setFacFilter(p=>p.includes(f)?p.filter(x=>x!==f):[...p,f]);
  const hasFilter = minPrice>0||maxPrice<5000000||facFilter.length>0;
  const [ptr, setPtr] = useState(0);
  const { pulling, dist, handlers:ptrHandlers } = usePullToRefresh(()=>setPtr(p=>p+1));
  const [tipDismissed,  setTipDismissed]  = useState(()=>localStorage.getItem('pk_tip_dismissed')==='1');
  const [coachDismissed,setCoachDismissed]= useState(()=>localStorage.getItem('pk_coach_dismissed')==='1');
  const [inAppBanner,   setInAppBanner]   = useState(()=>{
    const b = DB.getSeekerBookings(user.id);
    return b.find(bk=>bk.status==='confirmed') ?? null;
  });

  useEffect(()=>{
    setLoading(true);
    const t = setTimeout(()=>{ setList(DB.getListings()); setLoading(false); }, 700);
    return ()=>clearTimeout(t);
  },[query,campus,type,refresh,ptr]);

  const filtered = list.filter(l=>{
    if (l.isApartment) return false;
    const q = query.toLowerCase();
    return (!query || l.name.toLowerCase().includes(q) || l.location.toLowerCase().includes(q))
      && (!campus || (l.distanceToCampus||'').toLowerCase().includes(campus.toLowerCase()))
      && (!type   || l.type === type)
      && l.price >= minPrice && l.price <= maxPrice
      && (facFilter.length===0 || facFilter.every(f=>l.facilities.includes(f)));
  });

  return (
    <div {...ptrHandlers} style={{ background:C.surface, minHeight:'100%', paddingBottom:24, overflowY:'auto' }}>
      {pulling && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
          height:dist, overflow:'hidden', background:C.surface }}>
          <div style={{ fontSize:11, color:C.muted, display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:16, height:16, border:`2px solid ${C.primary}`, borderTopColor:'transparent',
              borderRadius:'50%', animation:dist>60?'spin .6s linear infinite':'none' }}/>
            {dist>60?'Lepaskan untuk refresh':'Tarik untuk refresh'}
          </div>
        </div>
      )}

      {/* In-app notification banner */}
      {inAppBanner && (
        <div style={{ margin:'12px 16px 0', background:C.dark, borderRadius:14, padding:'12px 16px',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.primary, marginBottom:2 }}>🔔 BOOKING DIKONFIRMASI</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>
              {(DB.getListings().find(l=>l.id===inAppBanner.listingId)?.name)||'Kost kamu'} – mulai {inAppBanner.startDate}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:800, color:C.primary, cursor:'pointer' }}>LIHAT DETAIL</span>
            <button onClick={()=>setInAppBanner(null)} style={{ background:'none', border:'none',
              cursor:'pointer', padding:0, lineHeight:1 }}>
              <X size={14} style={{ color:'rgba(255,255,255,.5)' }}/>
            </button>
          </div>
        </div>
      )}

      {/* Proactive tip card */}
      {!tipDismissed && (
        <div style={{ margin:'12px 16px 0', background:`${C.primary}18`, border:`1.5px solid ${C.primary}`,
          borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:10 }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🎓</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:800, color:C.dark, marginBottom:2 }}>
              Baru! Filter Dekat Kampus
            </div>
            <div style={{ fontSize:11, color:'#555', lineHeight:1.5, marginBottom:8 }}>
              Temukan kost dalam 1 km dari kampus pilihanmu.
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ setTipDismissed(true); localStorage.setItem('pk_tip_dismissed','1'); }}
                style={{ fontSize:11, fontWeight:800, color:C.dark, background:C.primary,
                  border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer' }}>
                COBA SEKARANG
              </button>
              <button onClick={()=>{ setTipDismissed(true); localStorage.setItem('pk_tip_dismissed','1'); }}
                style={{ fontSize:11, fontWeight:700, color:C.muted, background:'none',
                  border:'none', cursor:'pointer', padding:'5px' }}>
                Nanti saja ✕
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ background:`linear-gradient(135deg,${C.primary} 0%,${C.secondary} 100%)`, padding:'48px 18px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'rgba(26,26,26,.6)', marginBottom:2 }}>Selamat datang 👋</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:C.dark, margin:0 }}>
              Halo, {user.name.split(' ')[0]}!
            </h1>
          </div>
          <div style={{ background:'rgba(255,255,255,.4)', borderRadius:12, padding:'8px 10px' }}>
            <Bell size={18} style={{ color:C.dark }}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ position:'relative', flex:1 }}>
            <Search size={17} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.dark }}/>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              placeholder="Cari lokasi, kampus, atau nama kost..."
              style={{ width:'100%', boxSizing:'border-box', paddingLeft:42, paddingRight: query?36:16,
                paddingTop:14, paddingBottom:14, borderRadius:14, border:'none', outline:'none',
                fontSize:13, background:'#fff', boxShadow:'0 4px 16px rgba(0,0,0,.1)', color:C.dark }}/>
            {query && <button onClick={()=>setQuery('')}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                border:'none', background:'none', cursor:'pointer' }}>
              <X size={14} style={{ color:C.muted }}/>
            </button>}
          </div>
          <button onClick={()=>setSheet(true)} style={{ position:'relative', flexShrink:0, width:48, height:48,
            borderRadius:14, border:'none', background:'#fff', boxShadow:'0 4px 16px rgba(0,0,0,.1)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hasFilter?C.error:C.dark} strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            {hasFilter && <span style={{ position:'absolute', top:8, right:8, width:8, height:8,
              borderRadius:'50%', background:C.error, border:'2px solid #fff' }}/>}
          </button>
        </div>

      {/* ── BOTTOM SHEET FILTER ── */}
      {sheet && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          <div onClick={()=>setSheet(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)' }}/>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'#fff',
            borderRadius:'24px 24px 0 0', padding:'0 20px 40px', maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ width:40, height:4, borderRadius:4, background:'#e0e0e0', margin:'12px auto 20px' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <span style={{ fontSize:16, fontWeight:800, color:C.dark }}>Filter Pencarian</span>
              {hasFilter && <button onClick={()=>{ setMinPrice(0); setMaxPrice(5000000); setFacFilter([]); }}
                style={{ fontSize:11, fontWeight:700, color:C.error, background:'none', border:'none', cursor:'pointer' }}>
                Reset Filter
              </button>}
            </div>

            {/* Price range */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>Harga per Bulan</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.muted, marginBottom:10 }}>
                <span>{rupiah(minPrice)}</span><span>{maxPrice>=5000000?'Rp 5 jt+':rupiah(maxPrice)}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:10, color:C.muted, width:24 }}>Min</span>
                  <input type="range" min={0} max={5000000} step={100000} value={minPrice}
                    onChange={e=>setMinPrice(Math.min(+e.target.value, maxPrice-100000))}
                    style={{ flex:1, accentColor:C.primary }}/>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:10, color:C.muted, width:24 }}>Max</span>
                  <input type="range" min={0} max={5000000} step={100000} value={maxPrice}
                    onChange={e=>setMaxPrice(Math.max(+e.target.value, minPrice+100000))}
                    style={{ flex:1, accentColor:C.primary }}/>
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:12, textTransform:'uppercase', letterSpacing:.5 }}>Fasilitas</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {ALL_FACILITIES.map(f=>(
                  <button key={f} onClick={()=>toggleFac(f)} style={{
                    display:'flex', alignItems:'center', gap:4, padding:'8px 14px', borderRadius:20,
                    border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
                    background: facFilter.includes(f)?C.primary:'#f0f0f0',
                    color: facFilter.includes(f)?C.dark:'#666',
                  }}>
                    {FACI_ICON[f]??null}{f}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={()=>setSheet(false)} style={{ width:'100%', padding:'15px', borderRadius:20,
              border:'none', background:C.primary, color:C.dark, fontSize:14, fontWeight:800,
              cursor:'pointer', boxShadow:`0 6px 20px ${C.primary}50` }}>
              Tampilkan {filtered.length} Kost
            </button>
          </div>
        </div>
      )}
      </div>

      <div style={{ padding:'0 16px' }}>
        {/* Campus */}
        <div style={{ marginTop:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>🎓 Dekat Kampus</span>
            <span style={{ fontSize:10, color:C.muted, display:'flex', alignItems:'center', gap:3 }}>
              <HelpCircle size={12}/> dalam 1 km
            </span>
          </div>
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
              {CAMPUSES.map(c=>(
                <button key={c} onClick={()=>{ setCampus(campus===c?null:c);
                  if(!coachDismissed){ setCoachDismissed(true); localStorage.setItem('pk_coach_dismissed','1'); }
                }}
                  style={{ whiteSpace:'nowrap', padding:'7px 14px', borderRadius:20, fontSize:11, fontWeight:600,
                    border: campus===c ? 'none' : '1.5px solid #e0e0e0',
                    background: campus===c ? C.primary : '#fff',
                    color: campus===c ? C.dark : '#666', cursor:'pointer', transition:'all .15s' }}>
                  {c}
                </button>
              ))}
            </div>
            {!coachDismissed && (
              <div style={{ position:'absolute', top:46, left:0, zIndex:50,
                background:C.dark, borderRadius:12, padding:'10px 14px', maxWidth:230,
                boxShadow:'0 8px 24px rgba(0,0,0,.3)' }}>
                <div style={{ position:'absolute', top:-6, left:20, width:12, height:12,
                  background:C.dark, transform:'rotate(45deg)', borderRadius:2 }}/>
                <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:2 }}>👆 Tap kampusmu!</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', lineHeight:1.4, marginBottom:8 }}>
                  Filter kost dalam 1 km dari kampus pilihanmu secara otomatis.
                </div>
                <button onClick={()=>{ setCoachDismissed(true); localStorage.setItem('pk_coach_dismissed','1'); }}
                  style={{ fontSize:10, fontWeight:700, color:C.primary, background:'none',
                    border:'none', cursor:'pointer', padding:0 }}>Mengerti ✕</button>
              </div>
            )}
          </div>
        </div>

        {/* Type + Apartment filter */}
        <div style={{ display:'flex', gap:8, marginTop:12, overflowX:'auto', paddingBottom:2 }}>
          {[null,'putra','putri','campur'].map(t=>(
            <button key={String(t)} onClick={()=>setType(t)}
              style={{ whiteSpace:'nowrap', padding:'5px 12px', borderRadius:20, fontSize:10, fontWeight:600,
                border: type===t ? 'none' : '1.5px solid #e0e0e0',
                background: type===t ? C.dark : '#fff',
                color: type===t ? '#fff' : '#666', cursor:'pointer', flexShrink:0 }}>
              {t===null ? 'Semua' : t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
          <button onClick={onGoApartment}
            style={{ whiteSpace:'nowrap', padding:'5px 12px', borderRadius:20, fontSize:10, fontWeight:700,
              border:'none', background:C.primary, color:C.dark, cursor:'pointer', flexShrink:0,
              display:'flex', alignItems:'center', gap:4 }}>
            🏢 Apartemen <ChevronRight size={11}/>
          </button>
        </div>

        {/* Listings */}
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:12 }}>
            {campus ? `Kost Dekat ${campus}` : 'Semua Kost'} ({loading ? '...' : filtered.length})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {loading ? (
            <>
              {/* Progress bar */}
              <div style={{ position:'sticky', top:0, zIndex:10, height:3,
                background:'#f0f0f0', borderRadius:2, marginBottom:14, overflow:'hidden' }}>
                <div style={{ height:'100%', width:'70%', background:C.primary, borderRadius:2,
                  animation:'progBar 1.2s ease-in-out infinite' }}/>
              </div>
              <div style={{ fontSize:12, color:C.muted, textAlign:'center', marginBottom:12 }}>
                Sedang mencari kost terbaik untukmu...
              </div>
              {[1,2,3].map(i=><SkeletonCard key={i}/>)}
            </>
          )
              : filtered.length===0
                ? <div style={{ textAlign:'center', padding:'32px 0', color:C.muted }}>
                    <Search size={32} style={{ margin:'0 auto 12px', display:'block', color:'#ddd' }}/>
                    <div style={{ fontSize:13, fontWeight:600 }}>Tidak ada kost ditemukan</div>
                    <div style={{ fontSize:11, marginTop:4 }}>Coba ubah kata kunci atau filter</div>
                  </div>
                : filtered.map(l=><KostCard key={l.id} l={l}
                    isFav={favorites.includes(l.id)} onFav={onFav} onClick={onListingClick}/>)
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   APARTMENT CARD (landscape)
══════════════════════════════════════════════ */
function ApartmentCard({ l, isFav, onFav, onClick }:{
  l:Listing; isFav:boolean; onFav:(id:string)=>void; onClick:(l:Listing)=>void;
}) {
  const n  = avail(l);
  const st = roomStatus(n);
  const fallback = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800';
  return (
    <div onClick={()=>onClick(l)} style={{ background:'#fff', borderRadius:16, overflow:'hidden',
      boxShadow:'0 4px 20px rgba(0,0,0,.07)', cursor:'pointer', display:'flex', height:130 }}>
      {/* Left photo */}
      <div style={{ position:'relative', width:130, flexShrink:0 }}>
        <img src={l.image||fallback} alt={l.name}
          onError={e=>{(e.target as HTMLImageElement).src=fallback;}}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
        <button onClick={e=>{e.stopPropagation();onFav(l.id);}}
          style={{ position:'absolute', top:8, right:8, background:'rgba(255,255,255,.9)',
            border:'none', borderRadius:'50%', width:28, height:28, display:'flex',
            alignItems:'center', justifyContent:'center', cursor:'pointer',
            boxShadow:'0 2px 8px rgba(0,0,0,.15)' }}>
          <Heart size={13} style={{ fill:isFav?C.error:'none', color:isFav?C.error:'#ccc' }}/>
        </button>
        {l.unitType && (
          <span style={{ position:'absolute', bottom:8, left:8, background:C.primary, color:C.dark,
            fontSize:8, fontWeight:800, padding:'2px 7px', borderRadius:20 }}>{l.unitType}</span>
        )}
      </div>
      {/* Right content */}
      <div style={{ flex:1, padding:'12px 14px', display:'flex', flexDirection:'column', justifyContent:'space-between', overflow:'hidden' }}>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <span style={{ fontWeight:700, fontSize:13, color:C.dark, flex:1, paddingRight:6,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l.name}</span>
            {l.rating>0 && <span style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0 }}>
              <Star size={11} style={{ fill:C.primary, color:C.primary }}/>
              <span style={{ fontSize:11, fontWeight:700 }}>{l.rating.toFixed(1)}</span>
            </span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:3, color:C.muted, fontSize:11, marginTop:3 }}>
            <MapPin size={10}/><span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l.location}</span>
          </div>
          <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
            {l.furnished && (
              <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20,
                background: l.furnished==='furnished'?`${C.success}20`:'#f5f5f5',
                color: l.furnished==='furnished'?C.success:'#888' }}>
                {l.furnished==='furnished'?'Furnished':'Unfurnished'}
              </span>
            )}
            {(l.buildingFacilities||[]).slice(0,2).map(f=>(
              <span key={f} style={{ fontSize:9, fontWeight:600, padding:'2px 7px', borderRadius:20,
                background:'#f0f0f0', color:'#666' }}>{f}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div style={{ fontSize:14, fontWeight:800, color:C.dark }}>{rupiah(l.price)}<span style={{ fontSize:9, fontWeight:500, color:C.muted }}>/bln</span></div>
          <span style={{ fontSize:9, fontWeight:600, color:st.color }}>{n===0?'Penuh':`${n} unit`}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   APARTMENT VIEW
══════════════════════════════════════════════ */
const BUILDING_FACILITIES = ['Kolam Renang','Gym','Parkir','Keamanan 24 jam'];

function ApartmentView({ onBack, onListingClick, favorites, onFav }:{
  onBack:()=>void; onListingClick:(l:Listing)=>void;
  favorites:string[]; onFav:(id:string)=>void;
}) {
  const [unitType,  setUnitType]  = useState<string|null>(null);
  const [furnished, setFurnished] = useState<string|null>(null);
  const [bldgFac,   setBldgFac]   = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [list,      setList]      = useState<Listing[]>([]);

  useEffect(()=>{
    setLoading(true);
    const t = setTimeout(()=>{
      setList(DB.getListings().filter(l=>l.isApartment));
      setLoading(false);
    }, 600);
    return ()=>clearTimeout(t);
  },[]);

  const toggleBldg = (f:string) =>
    setBldgFac(prev=>prev.includes(f)?prev.filter(x=>x!==f):[...prev,f]);

  const filtered = list.filter(l=>{
    if (unitType && l.unitType !== unitType) return false;
    if (furnished && l.furnished !== furnished) return false;
    if (bldgFac.length>0 && !bldgFac.every(f=>(l.buildingFacilities||[]).includes(f))) return false;
    return true;
  });

  const chipBtn = (label:string, active:boolean, onClick:()=>void, dark=false) => (
    <button key={label} onClick={onClick} style={{
      whiteSpace:'nowrap', padding:'7px 14px', borderRadius:20, fontSize:11, fontWeight:700,
      border: active ? 'none' : '1.5px solid #e0e0e0',
      background: active ? (dark?C.dark:C.primary) : '#fff',
      color: active ? (dark?'#fff':C.dark) : '#666',
      cursor:'pointer', transition:'all .15s', flexShrink:0,
    }}>{label}</button>
  );

  return (
    <div style={{ background:C.surface, minHeight:'100%', paddingBottom:24 }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${C.dark} 0%,#333 100%)`,
        padding:'48px 18px 24px', borderBottomLeftRadius:24, borderBottomRightRadius:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <button onClick={onBack} style={{ width:36, height:36, borderRadius:12,
            background:'rgba(255,255,255,.15)', border:'none', display:'flex', alignItems:'center',
            justifyContent:'center', cursor:'pointer' }}>
            <ArrowLeft size={18} style={{ color:'#fff' }}/>
          </button>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:C.primary, textTransform:'uppercase', letterSpacing:1 }}>Kategori</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>🏢 Apartemen</h1>
          </div>
        </div>

        {/* Unit type filter */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
          {chipBtn('Semua Tipe', unitType===null, ()=>setUnitType(null))}
          {['Studio','1BR','2BR'].map(t=>chipBtn(t, unitType===t, ()=>setUnitType(unitType===t?null:t)))}
        </div>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Furnished filter */}
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          {chipBtn('Semua', furnished===null, ()=>setFurnished(null), true)}
          {chipBtn('✅ Furnished', furnished==='furnished', ()=>setFurnished(furnished==='furnished'?null:'furnished'), true)}
          {chipBtn('📦 Unfurnished', furnished==='unfurnished', ()=>setFurnished(furnished==='unfurnished'?null:'unfurnished'), true)}
        </div>

        {/* Building facilities filter */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Fasilitas Gedung</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {BUILDING_FACILITIES.map(f=>(
              <button key={f} onClick={()=>toggleBldg(f)} style={{
                display:'flex', alignItems:'center', gap:4, padding:'6px 12px',
                borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
                background: bldgFac.includes(f) ? C.primary : '#f0f0f0',
                color: bldgFac.includes(f) ? C.dark : '#666', transition:'all .15s',
              }}>
                {FACI_ICON[f]??null} {f}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:12 }}>
          {loading ? 'Memuat...' : `${filtered.length} unit tersedia`}
        </div>

        {/* Cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {loading
            ? [1,2,3].map(i=>(
                <div key={i} style={{ borderRadius:16, overflow:'hidden', height:130, display:'flex',
                  boxShadow:'0 4px 20px rgba(0,0,0,.05)' }}>
                  <div style={{ width:130, ...sk }}/>
                  <div style={{ flex:1, padding:'14px', display:'flex', flexDirection:'column', gap:8, background:'#fff' }}>
                    <div style={{ height:13, ...sk, borderRadius:8, width:'70%' }}/>
                    <div style={{ height:10, ...sk, borderRadius:8, width:'50%' }}/>
                    <div style={{ height:10, ...sk, borderRadius:8, width:'40%' }}/>
                  </div>
                </div>
              ))
            : filtered.length===0
              ? <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
                  <Building2 size={40} style={{ margin:'0 auto 12px', display:'block', color:'#ddd' }}/>
                  <div style={{ fontSize:13, fontWeight:600 }}>Tidak ada unit ditemukan</div>
                  <div style={{ fontSize:11, marginTop:4 }}>Coba ubah atau hapus filter</div>
                </div>
              : filtered.map(l=>(
                  <ApartmentCard key={l.id} l={l}
                    isFav={favorites.includes(l.id)} onFav={onFav} onClick={onListingClick}/>
                ))
          }
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   FAVORITES
══════════════════════════════════════════════ */
function FavoritesView({ favorites, onListingClick, onFav }:{
  favorites:string[]; onListingClick:(l:Listing)=>void; onFav:(id:string)=>void;
}) {
  const favs = DB.getListings().filter(l=>favorites.includes(l.id));
  const [confirmId, setConfirmId] = useState<string|null>(null);
  const confirmItem = confirmId ? DB.getListings().find(l=>l.id===confirmId) : null;
  return (
    <div style={{ background:C.surface, minHeight:'100%', padding:'52px 16px 24px' }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.dark, marginBottom:20 }}>Favorit Saya</h1>
      {favs.length===0
        ? <div style={{ textAlign:'center', padding:'60px 0', color:C.muted }}>
            <Heart size={48} style={{ margin:'0 auto 12px', display:'block', color:'#eee' }}/>
            <div style={{ fontSize:14, fontWeight:600 }}>Belum ada favorit</div>
            <div style={{ fontSize:12, marginTop:4 }}>Tap ikon hati di kartu kost untuk menyimpan</div>
          </div>
        : <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {favs.map(l=><KostCard key={l.id} l={l} isFav onFav={id=>setConfirmId(id)} onClick={onListingClick}/>)}
          </div>
      }

      {/* Hapus Favorit Dialog */}
      {confirmId && confirmItem && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:'24px', maxWidth:320, width:'100%' }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.dark, marginBottom:6 }}>Hapus dari Favorit?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:6 }}>{confirmItem.name}</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:20, lineHeight:1.5 }}>
              Kost ini akan dihapus dari daftar favoritmu.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setConfirmId(null)} style={{ flex:1, padding:'12px', borderRadius:12,
                border:`2px solid ${C.primary}`, background:'#fff', color:C.dark,
                fontSize:13, fontWeight:700, cursor:'pointer' }}>Batal</button>
              <button onClick={()=>{ onFav(confirmId); setConfirmId(null); }}
                style={{ flex:1, padding:'12px', borderRadius:12, border:'none',
                  background:C.error, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   DETAIL
══════════════════════════════════════════════ */
function DetailView({ l, onBack, onBooking, isFav, onFav }:{
  l:Listing; onBack:()=>void; onBooking:()=>void; isFav:boolean; onFav:(id:string)=>void;
}) {
  const n  = avail(l);
  const st = roomStatus(n);
  const fallback = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600';
  const [photoZoom, setPhotoZoom] = useState(false);
  const { copy, copied } = useClipboard();
  const phoneLp = useLongPress(()=>copy(l.ownerId==='seed'?'0812-3456-7890':'0821-0000-0000'));
  return (
    <div style={{ background:'#fff', minHeight:'100%' }}>
      <div style={{ position:'relative' }}>
        <img src={l.image||fallback} alt={l.name}
          onError={e=>{(e.target as HTMLImageElement).src=fallback;}}
          onClick={()=>setPhotoZoom(true)}
          style={{ width:'100%', height:260, objectFit:'cover', display:'block', cursor:'zoom-in' }}/>

        {/* Photo Zoom Modal (Pinch-to-Zoom equivalent) */}
        {photoZoom && (
          <div onClick={()=>setPhotoZoom(false)} style={{ position:'fixed', inset:0, zIndex:500,
            background:'rgba(0,0,0,.95)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img src={l.image||fallback} alt={l.name}
              style={{ maxWidth:'100%', maxHeight:'90vh', objectFit:'contain' }}/>
            <button onClick={()=>setPhotoZoom(false)} style={{ position:'absolute', top:48, right:16,
              background:'rgba(255,255,255,.15)', border:'none', borderRadius:'50%', width:38, height:38,
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <X size={18} style={{ color:'#fff' }}/>
            </button>
            <div style={{ position:'absolute', bottom:32, left:0, right:0, textAlign:'center',
              fontSize:11, color:'rgba(255,255,255,.5)' }}>Tap untuk menutup</div>
          </div>
        )}

        {/* Copied toast */}
        {copied && (
          <div style={{ position:'fixed', bottom:100, left:'50%', transform:'translateX(-50%)',
            background:C.dark, color:'#fff', padding:'10px 20px', borderRadius:20, fontSize:12,
            fontWeight:700, zIndex:400, whiteSpace:'nowrap' }}>
            ✓ Nomor HP disalin!
          </div>
        )}
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0,
          background:'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, transparent 40%)' }}/>
        <button onClick={onBack} style={{ position:'absolute', top:48, left:16,
          background:'rgba(255,255,255,.9)', border:'none', borderRadius:'50%', width:38, height:38,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          boxShadow:'0 2px 8px rgba(0,0,0,.15)' }}>
          <ArrowLeft size={18} style={{ color:C.dark }}/>
        </button>
        <button onClick={()=>onFav(l.id)} style={{ position:'absolute', top:48, right:16,
          background:'rgba(255,255,255,.9)', border:'none', borderRadius:'50%', width:38, height:38,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          boxShadow:'0 2px 8px rgba(0,0,0,.15)' }}>
          <Heart size={18} style={{ fill:isFav?C.error:'none', color:isFav?C.error:C.dark }}/>
        </button>
        <div style={{ position:'absolute', bottom:14, left:14 }}>
          <span style={{ background:C.primary, color:C.dark, fontSize:10, fontWeight:700,
            padding:'3px 10px', borderRadius:20, textTransform:'uppercase' }}>{l.type}</span>
        </div>
      </div>

      <div style={{ padding:'20px 18px 120px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.dark, margin:0, flex:1 }}>{l.name}</h2>
          {l.rating>0 && <div style={{ display:'flex', alignItems:'center', gap:4, marginLeft:8 }}>
            <Star size={15} style={{ fill:C.primary, color:C.primary }}/>
            <span style={{ fontSize:14, fontWeight:700 }}>{l.rating.toFixed(1)}</span>
          </div>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, color:C.muted, fontSize:12, marginBottom:6 }}>
          <MapPin size={13}/>{l.location}
        </div>
        {l.distanceToCampus && <div style={{ fontSize:12, fontWeight:700, color:C.primary, marginBottom:12 }}>
          🎓 {l.distanceToCampus}
        </div>}

        {/* Status */}
        <div style={{ background:st.color+'18', border:`1.5px solid ${st.color}30`, borderRadius:12,
          padding:'10px 14px', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:st.color, flexShrink:0 }}/>
          <span style={{ fontSize:12, fontWeight:600, color:st.color }}>{st.text}</span>
        </div>

        {/* Price */}
        <div style={{ background:C.surface, borderRadius:14, padding:'16px', marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.dark }}>Harga Sewa per Tipe Kamar</div>
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700,
              color:C.success, background:`${C.success}15`, padding:'3px 10px', borderRadius:20 }}>
              <CheckCircle2 size={11}/> Terverifikasi
            </span>
          </div>
          {[
            { type:'Standar', price: l.price, desc:'Kipas angin, kamar mandi dalam' },
            { type:'AC',      price: Math.round(l.price*1.3), desc:'AC, kamar mandi dalam' },
            { type:'Deluxe',  price: Math.round(l.price*1.6), desc:'AC, balkon, lemari besar' },
          ].map((r,i)=>(
            <div key={r.type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'10px 0', borderBottom: i<2?'1px solid #f0f0f0':'none' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.dark }}>{r.type}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{r.desc}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:15, fontWeight:900, color:C.dark }}>{rupiah(r.price)}</div>
                <div style={{ fontSize:10, color:C.muted }}>/bulan</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop:12, background:'#fff', borderRadius:10, padding:'10px 12px',
            border:'1px solid #f0f0f0' }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.dark, marginBottom:6 }}>
              💡 Estimasi Total (6 bulan):
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
              <span style={{ color:'#555' }}>Sewa standar × 6</span>
              <span style={{ fontWeight:700 }}>{rupiah(l.price*6)}</span>
            </div>
          </div>
          <div style={{ marginTop:10, fontSize:11, color:C.muted, lineHeight:1.6 }}>
            ⚠️ Biaya belum termasuk: listrik (Rp 1.500/kWh), air (Rp 50.000/bln), kebersihan (Rp 25.000/bln)
          </div>
        </div>

        {/* Description */}
        {l.description && <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:8 }}>Deskripsi</div>
          <p style={{ fontSize:13, color:'#555', margin:0, lineHeight:1.6 }}>{l.description}</p>
        </div>}

        {/* Facilities */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:10 }}>Fasilitas</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {l.facilities.map(f=>(
              <div key={f} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                background:'#fff', border:'1.5px solid #eee', borderRadius:20, fontSize:12, color:'#444' }}>
                {FACI_ICON[f]??null}{f}
              </div>
            ))}
          </div>
        </div>

        {/* Owner contact */}
        <div style={{ background:C.surface, borderRadius:14, padding:'14px 16px',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:C.primary,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700 }}>
              {l.ownerId==='seed' ? 'P' : l.ownerId.slice(-1).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:13 }}>Pemilik Kost</div>
              <div style={{ fontSize:11, color:C.success }}>● Online</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ width:38, height:38, borderRadius:12, background:'#f0f0f0', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <MessageSquare size={16} style={{ color:'#555' }}/>
            </button>
            <button {...phoneLp} title="Tahan untuk salin nomor HP"
              style={{ width:38, height:38, borderRadius:12, background:C.primary, border:'none',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <Phone size={16} style={{ color:C.dark }}/>
            </button>
          </div>
        </div>
      </div>

      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430, background:'#fff', borderTop:'1px solid #f0f0f0',
        padding:'14px 18px 32px', boxShadow:'0 -4px 20px rgba(0,0,0,.08)' }}>
        <button onClick={onBooking} disabled={n===0}
          style={{ width:'100%', padding:'16px', borderRadius:20, border:'none',
            cursor: n===0?'not-allowed':'pointer',
            background: n===0?'#e0e0e0':C.primary, color: n===0?'#999':C.dark,
            fontSize:14, fontWeight:800, letterSpacing:.5,
            boxShadow: n===0?'none':`0 6px 20px ${C.primary}60` }}>
          {n===0 ? 'Kamar Penuh – Tidak Tersedia' : 'BOOKING SEKARANG'}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   BOOKING
══════════════════════════════════════════════ */
function BookingView({ listing, user, onBack, onSuccess }:{
  listing:Listing; user:AppUser; onBack:()=>void; onSuccess:()=>void;
}) {
  const n = avail(listing);

  // §9.2.4 – Error: kost tidak tersedia
  if (n === 0) return (
    <div style={{ background:'#fff', minHeight:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:'32px 24px', textAlign:'center' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:`${C.error}12`,
        display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
        <AlertCircle size={40} style={{ color:C.error }}/>
      </div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.dark, margin:'0 0 8px' }}>
        Booking Tidak Dapat Diproses
      </h2>
      <p style={{ fontSize:13, color:C.muted, margin:'0 0 20px', lineHeight:1.6 }}>
        Maaf, permintaan booking kamu tidak dapat dilanjutkan saat ini.
      </p>
      <div style={{ background:C.surface, borderRadius:14, padding:'16px', width:'100%',
        textAlign:'left', marginBottom:24 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:10 }}>
          Kemungkinan penyebab:
        </div>
        {[
          'Semua kamar sudah penuh terisi penghuni',
          'Listing sedang dalam proses verifikasi pemilik',
          'Pemilik menutup sementara penerimaan booking',
        ].map(p=>(
          <div key={p} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
            <span style={{ color:C.error, fontWeight:700, fontSize:12, flexShrink:0 }}>•</span>
            <span style={{ fontSize:12, color:'#555', lineHeight:1.5 }}>{p}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:10, width:'100%' }}>
        <button onClick={onBack} style={{ flex:1, padding:'14px', borderRadius:16,
          border:`2px solid ${C.primary}`, background:'#fff', color:C.dark,
          fontSize:13, fontWeight:700, cursor:'pointer' }}>
          COBA LAGI
        </button>
        <button onClick={()=>window.open('https://wa.me/6281200000000?text=Halo CS PapiKost, saya butuh bantuan booking')}
          style={{ flex:1, padding:'14px', borderRadius:16, border:'none', background:C.primary,
            color:C.dark, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          HUBUNGI CS
        </button>
      </div>
    </div>
  );
  const [step, setStep]     = useState(1);
  const [done, setDone]     = useState(false);
  const [saved,setSaved]    = useState<Booking|null>(null);
  const [form, setForm]     = useState({ name:user.name, phone:user.phone, startDate:'', duration:'1' });
  const [err,  setErr]      = useState<Record<string,string>>({});
  const [dialog,setDialog]  = useState(false);

  const validate = () => {
    if (step!==2) return true;
    const e: Record<string,string> = {};
    if (!form.name.trim()) e.name = 'Nama lengkap wajib diisi sesuai KTP';
    if (!/^08\d{8,11}$/.test(form.phone)) e.phone = 'Format tidak valid (cth: 0812-xxxx-xxxx)';
    if (!form.startDate) { e.startDate = 'Tanggal masuk wajib diisi'; }
    else {
      const sel = new Date(form.startDate);
      const tom = new Date(); tom.setDate(tom.getDate()+1);
      if (sel < tom) e.startDate = 'Tanggal masuk minimal besok';
    }
    setErr(e);
    return Object.keys(e).length===0;
  };

  const next = () => {
    if (!validate()) return;
    if (step===4) {
      const b = DB.addBooking({
        listingId:listing.id, seekerId:user.id, ownerId:listing.ownerId,
        listingName:listing.name, listingLocation:listing.location, listingImage:listing.image,
        seekerName:form.name, seekerPhone:form.phone, startDate:form.startDate,
        duration:parseInt(form.duration),
        totalPrice:listing.price*parseInt(form.duration),
        status:'pending',
      });
      setSaved(b); setDone(true);
      return;
    }
    setStep(s=>s+1);
  };

  const STEPS = ['Pilih Kamar','Data Penyewa','Konfirmasi','Selesai'];

  if (done && saved) return (
    <div style={{ background:'#fff', minHeight:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:'32px 24px', textAlign:'center' }}>
      <div style={{ width:88, height:88, borderRadius:'50%', background:C.success,
        display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24,
        animation:'popIn .4s cubic-bezier(.34,1.56,.64,1)' }}>
        <CheckCircle2 size={44} style={{ color:'#fff' }}/>
      </div>
      <h2 style={{ fontSize:24, fontWeight:800, color:C.dark, margin:'0 0 10px' }}>Booking Terkirim!</h2>
      <p style={{ fontSize:13, color:C.muted, margin:'0 0 28px', lineHeight:1.6 }}>
        Permintaan kamu sudah disimpan. Pemilik akan merespons dalam 1×24 jam.
      </p>
      <div style={{ background:C.surface, borderRadius:14, padding:'16px 20px', width:'100%',
        textAlign:'left', marginBottom:24 }}>
        <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Ringkasan Booking</div>
        <div style={{ fontSize:14, fontWeight:700, color:C.dark }}>{listing.name}</div>
        <div style={{ fontSize:12, color:C.muted }}>{listing.location}</div>
        <div style={{ marginTop:8, fontSize:13, fontWeight:700, color:C.dark }}>
          {rupiah(saved.totalPrice)} · {saved.duration} bulan
        </div>
        <div style={{ marginTop:6 }}>
          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
            background:`${C.warning}20`, color:C.warning }}>Menunggu Konfirmasi</span>
        </div>
      </div>
      <button onClick={onSuccess} style={{ width:'100%', padding:'16px', borderRadius:20,
        border:'none', background:C.primary, color:C.dark, fontSize:14, fontWeight:800,
        cursor:'pointer', boxShadow:`0 6px 20px ${C.primary}60` }}>
        LIHAT RIWAYAT BOOKING
      </button>
    </div>
  );

  return (
    <div style={{ background:C.surface, minHeight:'100%', paddingBottom:24 }}>
      <div style={{ background:'#fff', padding:'52px 18px 18px', borderBottom:'1px solid #f0f0f0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={()=>setDialog(true)} style={{ width:36, height:36, borderRadius:12,
            background:'#f5f5f5', border:'none', display:'flex', alignItems:'center',
            justifyContent:'center', cursor:'pointer' }}>
            <ArrowLeft size={18}/>
          </button>
          <span style={{ fontSize:18, fontWeight:800, color:C.dark }}>Booking Kost</span>
        </div>
        <div style={{ display:'flex', alignItems:'center' }}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              gap:4, position:'relative' }}>
              {i>0 && <div style={{ position:'absolute', left:'-50%', right:'50%', top:13,
                height:2, background: step>i ? C.primary : '#e0e0e0' }}/>}
              <div style={{ width:28, height:28, borderRadius:'50%', zIndex:1,
                background: step>i ? C.primary : step===i+1 ? C.dark : '#e0e0e0',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700, color: step>i ? C.dark : step===i+1 ? '#fff' : '#999' }}>
                {step>i+1 ? <CheckCircle2 size={14}/> : i+1}
              </div>
              <span style={{ fontSize:9, fontWeight:600, color: step===i+1?C.dark:'#aaa', textAlign:'center' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'20px 16px' }}>
        <div style={{ background:'#fff', borderRadius:16, padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
          {step===1 && (
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:14 }}>Pilih Tipe Kamar</div>
              <div style={{ border:`2px solid ${C.primary}`, borderRadius:14, padding:'14px 16px',
                background:`${C.primary}10`, cursor:'pointer' }}>
                <div style={{ fontWeight:700, fontSize:13 }}>Kamar Standar</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                  Tersedia: {avail(listing)} kamar
                </div>
                <div style={{ fontSize:14, fontWeight:800, color:C.dark, marginTop:6 }}>
                  {rupiah(listing.price)}/bulan
                </div>
              </div>
            </div>
          )}

          {step===2 && (
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:14 }}>Data Penyewa</div>
              {([
                { key:'name'      as const, label:'Nama Lengkap',                        placeholder:'Nama sesuai KTP (cth: Budi Santoso)',  type:'text',
                  validate:(v:string)=> v.length>0&&v.length<3?'Nama minimal 3 karakter':'' },
                { key:'phone'     as const, label:'Nomor WhatsApp',                      placeholder:'08xx-xxxx-xxxx (WhatsApp aktif)',       type:'tel',
                  validate:(v:string)=> v.length>0&&!/^(08|62)\d{8,12}$/.test(v.replace(/[-\s]/g,''))?'Format tidak valid. Gunakan: 08xx-xxxx-xxxx':'' },
                { key:'startDate' as const, label:'Tanggal Mulai (paling cepat besok)',  placeholder:'',                                     type:'date',
                  validate:(v:string)=> v&&new Date(v)<=new Date()?'Tanggal harus besok atau setelahnya':'' },
              ]).map(f=>(
                <div key={f.key} style={{ marginBottom:14 }}>
                  <label style={{ fontSize:10, fontWeight:700, color:'#666', textTransform:'uppercase',
                    letterSpacing:.5, display:'block', marginBottom:4 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                    onChange={e=>{
                      const v = e.target.value;
                      setForm(p=>({...p,[f.key]:v}));
                      setErr(r=>({...r,[f.key]:f.validate?.(v)||''}));
                    }}
                    style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', borderRadius:10,
                      border: err[f.key] ? `2px solid ${C.error}` : '1.5px solid #e8e8e8',
                      fontSize:13, outline:'none', color:C.dark,
                      background: err[f.key] ? '#fff5f5' : '#fafafa' }}/>
                  {err[f.key] && <div style={{ fontSize:11, color:C.error, marginTop:4,
                    display:'flex', gap:4, alignItems:'center' }}>
                    <AlertCircle size={11}/>{err[f.key]}
                  </div>}
                </div>
              ))}
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#666', textTransform:'uppercase',
                  letterSpacing:.5, display:'block', marginBottom:4 }}>Durasi Sewa</label>
                <select value={form.duration} onChange={e=>setForm(p=>({...p,duration:e.target.value}))}
                  style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #e8e8e8',
                    fontSize:13, background:'#fafafa', color:C.dark, outline:'none' }}>
                  {[1,3,6,12].map(d=>(
                    <option key={d} value={String(d)}>
                      {d} bulan – {rupiah(listing.price*d)}{d>1?` (hemat ${d>=12?15:d>=6?10:5}%)`:''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step===3 && (
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:14 }}>Konfirmasi &amp; Bayar</div>
              <div style={{ background:C.surface, borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
                {[['Kost',listing.name],['Lokasi',listing.location],
                  ['Nama',form.name],['HP',form.phone],
                  ['Mulai',form.startDate],['Durasi',`${form.duration} bulan`]
                ].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between',
                    padding:'5px 0', borderBottom:'1px solid #f0f0f0' }}>
                    <span style={{ fontSize:12, color:C.muted }}>{k}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:C.dark, textAlign:'right', maxWidth:'60%' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>Total</span>
                  <span style={{ fontSize:15, fontWeight:800, color:C.dark }}>
                    {rupiah(listing.price*parseInt(form.duration))}
                  </span>
                </div>
              </div>
              <div style={{ background:'#fff8e1', border:'1.5px solid #ffd04a', borderRadius:12,
                padding:'12px 14px', fontSize:11, color:'#7a5c00', lineHeight:1.5 }}>
                ⚠️ Biaya DP tidak dapat dikembalikan setelah konfirmasi pemilik.
              </div>
            </div>
          )}

          {step===4 && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <CheckCircle2 size={48} style={{ color:C.primary, margin:'0 auto 12px', display:'block' }}/>
              <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>Siap Dikirim!</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>Klik konfirmasi untuk menyimpan.</div>
            </div>
          )}

          {(() => {
            const step2HasErr = step===2 && (!!err.name||!!err.phone||!!err.startDate||!form.name||!form.phone||!form.startDate);
            return (
              <button onClick={next} disabled={step2HasErr}
                style={{ width:'100%', marginTop:16, padding:'15px', borderRadius:20,
                  border:'none', fontSize:14, fontWeight:800, cursor: step2HasErr?'not-allowed':'pointer',
                  background: step2HasErr?'#e0e0e0':C.primary, color: step2HasErr?'#aaa':C.dark,
                  boxShadow: step2HasErr?'none':`0 6px 20px ${C.primary}50`, transition:'all .2s' }}>
                {step===4 ? 'KONFIRMASI BOOKING' : step2HasErr ? 'Lengkapi data dulu...' : 'LANJUTKAN'}
              </button>
            );
          })()}
        </div>
      </div>

      {dialog && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:'24px', maxWidth:320, width:'100%' }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.dark, marginBottom:8 }}>Batalkan Booking?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.5 }}>
              Data yang sudah diisi akan hilang.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setDialog(false)} style={{ flex:1, padding:'12px', borderRadius:12,
                border:`2px solid ${C.primary}`, background:'#fff', color:C.dark, fontSize:13,
                fontWeight:700, cursor:'pointer' }}>Kembali</button>
              <button onClick={onBack} style={{ flex:1, padding:'12px', borderRadius:12, border:'none',
                background:C.error, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Batalkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MY BOOKINGS (seeker)
══════════════════════════════════════════════ */
function MyBookingsView({ user, onListingClick, refresh }:{
  user:AppUser; onListingClick:(l:Listing)=>void; refresh:number;
}) {
  const bookings = DB.getSeekerBookings(user.id)
    .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());

  return (
    <div style={{ background:C.surface, minHeight:'100%', padding:'52px 16px 24px' }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.dark, marginBottom:20 }}>Riwayat Booking</h1>
      {bookings.length===0
        ? <div style={{ textAlign:'center', padding:'60px 0', color:C.muted }}>
            <ClipboardList size={48} style={{ margin:'0 auto 12px', display:'block', color:'#eee' }}/>
            <div style={{ fontSize:14, fontWeight:600 }}>Belum ada booking</div>
            <div style={{ fontSize:12, marginTop:4 }}>Mulai cari kost dan lakukan booking pertamamu</div>
          </div>
        : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {bookings.map(b=>{
              const st = BOOKING_LABEL[b.status];
              const listing = DB.getListings().find(l=>l.id===b.listingId);
              return (
                <div key={b.id} style={{ background:'#fff', borderRadius:14, overflow:'hidden',
                  boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
                  <div style={{ display:'flex', gap:12, padding:'14px' }}>
                    <img src={b.listingImage} alt={b.listingName}
                      style={{ width:72, height:72, objectFit:'cover', borderRadius:10, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:C.dark }}>{b.listingName}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{b.listingLocation}</div>
                      <div style={{ fontSize:11, color:C.muted }}>Mulai: {b.startDate} · {b.duration} bulan</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                        <span style={{ fontSize:13, fontWeight:800, color:C.dark }}>{rupiah(b.totalPrice)}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20,
                          background:`${st.color}15`, color:st.color }}>{st.label}</span>
                      </div>
                    </div>
                  </div>
                  {listing && <div style={{ borderTop:'1px solid #f5f5f5' }}>
                    <button onClick={()=>onListingClick(listing)}
                      style={{ width:'100%', padding:'10px', border:'none', background:'none',
                        fontSize:11, fontWeight:700, color:C.primary, cursor:'pointer' }}>
                      Lihat Detail Kost →
                    </button>
                  </div>}
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════
   OWNER DASHBOARD
══════════════════════════════════════════════ */
function OwnerDashboard({ user, onAddListing, refresh }:{
  user:AppUser; onAddListing:()=>void; refresh:number;
}) {
  const [tab, setTab] = useState<'props'|'bookings'>('props');
  const listings = DB.getOwnerListings(user.id);
  const bookings = DB.getOwnerBookings(user.id)
    .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const pending = bookings.filter(b=>b.status==='pending').length;

  const act = (id:string, status: 'confirmed'|'rejected') => {
    DB.updateBookingStatus(id, status);
    window.dispatchEvent(new Event('pk_refresh'));
  };

  const del = (id:string) => {
    if (!confirm('Hapus listing ini?')) return;
    DB.deleteListing(id);
    window.dispatchEvent(new Event('pk_refresh'));
  };

  const totalRooms    = listings.reduce((s,l)=>s+l.totalRooms,0);
  const occupiedRooms = listings.reduce((s,l)=>s+l.occupiedRooms,0);
  const emptyRooms    = listings.reduce((s,l)=>s+avail(l),0);

  return (
    <div style={{ background:C.surface, minHeight:'100%', padding:'52px 16px 24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.dark, margin:0 }}>Kos Saya</h1>
        <button onClick={onAddListing} style={{ display:'flex', alignItems:'center', gap:6,
          background:C.primary, border:'none', borderRadius:20, padding:'8px 14px',
          fontSize:12, fontWeight:700, cursor:'pointer', color:C.dark }}>
          <PlusCircle size={15}/> Tambah
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { label:'Properti',  value:listings.length,   icon:<Building2 size={18}/>,    bg:`${C.primary}20` },
          { label:'Penghuni',  value:occupiedRooms,     icon:<User size={18}/>,          bg:'#e8f5e9'         },
          { label:'Kosong',    value:emptyRooms,         icon:<TrendingUp size={18}/>,   bg:'#fff3e0'         },
        ].map(s=>(
          <div key={s.label} style={{ background:'#fff', borderRadius:14, padding:'12px 10px',
            textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
            <div style={{ width:36, height:36, borderRadius:12, background:s.bg, display:'flex',
              alignItems:'center', justifyContent:'center', margin:'0 auto 8px', color:C.dark }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:900, color:C.dark }}>{s.value}</div>
            <div style={{ fontSize:10, color:C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {pending>0 && (
        <div style={{ background:`${C.warning}15`, border:`1.5px solid ${C.warning}40`, borderRadius:12,
          padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <Bell size={16} style={{ color:C.warning }}/>
          <span style={{ fontSize:12, fontWeight:600, color:C.warning }}>
            {pending} permintaan booking menunggu konfirmasi kamu
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid #f0f0f0', marginBottom:16 }}>
        {(['props','bookings'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ flex:1, padding:'12px 8px', border:'none', background:'none', fontSize:12,
              fontWeight: tab===t ? 800 : 500, cursor:'pointer', transition:'all .15s',
              color: tab===t ? C.dark : C.muted, position:'relative' }}>
            {t==='props' ? '🏘️ Properti' : `📋 Booking${pending>0?` (${pending})`:''}`}
            {tab===t && <div style={{ position:'absolute', bottom:-2, left:0, right:0, height:2,
              background:C.primary, borderRadius:2 }}/>}
          </button>
        ))}
      </div>

      {tab==='props' && (
        listings.length===0
          ? <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
              <Building2 size={48} style={{ margin:'0 auto 12px', display:'block', color:'#eee' }}/>
              <div style={{ fontSize:14, fontWeight:600 }}>Belum ada properti</div>
              <button onClick={onAddListing} style={{ marginTop:12, padding:'10px 20px', borderRadius:20,
                border:'none', background:C.primary, color:C.dark, fontWeight:700, fontSize:12, cursor:'pointer' }}>
                + Tambah Listing Pertama
              </button>
            </div>
          : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {listings.map(l=>{
                const occ = l.occupiedRooms/l.totalRooms;
                return (
                  <div key={l.id} style={{ background:'#fff', borderRadius:14, overflow:'hidden',
                    boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
                    <div style={{ display:'flex', gap:12, padding:'12px' }}>
                      <img src={l.image} alt={l.name}
                        style={{ width:72, height:72, objectFit:'cover', borderRadius:10, flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:13, color:C.dark }}>{l.name}</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{l.location}</div>
                        <div style={{ fontSize:12, fontWeight:800, color:C.dark, marginTop:4 }}>{rupiah(l.price)}/bln</div>
                        <div style={{ marginTop:8 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontSize:10, color:C.muted }}>Hunian</span>
                            <span style={{ fontSize:10, fontWeight:700,
                              color: avail(l)===0?C.error:avail(l)===1?C.warning:C.success }}>
                              {l.occupiedRooms}/{l.totalRooms} terisi
                            </span>
                          </div>
                          <div style={{ height:5, background:'#f0f0f0', borderRadius:4, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${occ*100}%`, borderRadius:4,
                              background: occ>=1?C.error:occ>.7?C.warning:C.success }}/>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ borderTop:'1px solid #f5f5f5' }}>
                      <button onClick={()=>del(l.id)}
                        style={{ width:'100%', padding:'10px', border:'none', background:'none',
                          fontSize:11, fontWeight:700, color:C.error, cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                        <Trash2 size={12}/> Hapus Listing
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
      )}

      {tab==='bookings' && (
        bookings.length===0
          ? <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
              <ClipboardList size={48} style={{ margin:'0 auto 12px', display:'block', color:'#eee' }}/>
              <div style={{ fontSize:14, fontWeight:600 }}>Belum ada booking masuk</div>
            </div>
          : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {bookings.map(b=>{
                const st = BOOKING_LABEL[b.status];
                return (
                  <div key={b.id} style={{ background:'#fff', borderRadius:14, padding:'14px 16px',
                    boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:C.dark }}>{b.seekerName}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{b.listingName}</div>
                        <div style={{ fontSize:11, color:C.muted }}>
                          Mulai {b.startDate} · {b.duration} bulan
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginTop:4 }}>
                          {rupiah(b.totalPrice)}
                        </div>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20,
                        background:`${st.color}15`, color:st.color, whiteSpace:'nowrap' }}>{st.label}</span>
                    </div>
                    {b.status==='pending' && (
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={()=>act(b.id,'rejected')}
                          style={{ flex:1, padding:'8px', borderRadius:10, border:`1.5px solid ${C.error}`,
                            background:'none', color:C.error, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          Tolak
                        </button>
                        <button onClick={()=>act(b.id,'confirmed')}
                          style={{ flex:1, padding:'8px', borderRadius:10, border:'none',
                            background:C.success, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          Konfirmasi ✓
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   ADD LISTING
══════════════════════════════════════════════ */
function AddListingView({ user, onBack, onSaved }:{
  user:AppUser; onBack:()=>void; onSaved:()=>void;
}) {
  const [form, setForm] = useState({
    name:'', location:'', price:'', type:'campur' as Listing['type'],
    image:'', facilities:[] as string[], distanceToCampus:'',
    totalRooms:'', description:'',
  });
  const [err,   setErr]   = useState<Record<string,string>>({});
  const [busy,  setBusy]  = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const setF = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
      setForm(p=>({...p,[k]:e.target.value}));

  const togFac = (f:string) => setForm(p=>({
    ...p, facilities: p.facilities.includes(f) ? p.facilities.filter(x=>x!==f) : [...p.facilities,f]
  }));

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.name.trim())                                      e.name       = 'Nama kost wajib diisi';
    if (!form.location.trim())                                  e.location   = 'Lokasi wajib diisi';
    if (!form.price||isNaN(+form.price)||+form.price<100000)    e.price      = 'Harga wajib diisi (min. Rp 100.000)';
    if (!form.totalRooms||isNaN(+form.totalRooms)||+form.totalRooms<1) e.totalRooms = 'Jumlah kamar wajib diisi (min. 1)';
    if (form.facilities.length===0)                             e.facilities = 'Pilih minimal 1 fasilitas';
    setErr(e);
    return Object.keys(e).length===0;
  };

  const save = () => {
    if (!validate()) return;
    setBusy(true);
    setTimeout(()=>{
      DB.addListing({
        ownerId: user.id,
        name: form.name.trim(), location: form.location.trim(), price: +form.price,
        type: form.type, description: form.description.trim(),
        image: form.image.trim() || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600',
        facilities: form.facilities, distanceToCampus: form.distanceToCampus.trim(),
        totalRooms: +form.totalRooms, occupiedRooms: 0,
      });
      setBusy(false); setSaved(true);
      setTimeout(onSaved, 1400);
    }, 800);
  };

  if (saved) return (
    <div style={{ background:'#fff', minHeight:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:32, textAlign:'center' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:C.success, display:'flex',
        alignItems:'center', justifyContent:'center', marginBottom:20,
        animation:'popIn .4s cubic-bezier(.34,1.56,.64,1)' }}>
        <CheckCircle2 size={40} style={{ color:'#fff' }}/>
      </div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.dark, margin:'0 0 8px' }}>Listing Berhasil!</h2>
      <p style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>Kost kamu sudah tayang di platform PapiKost.</p>
    </div>
  );

  const fieldStyle = (hasErr?:boolean): React.CSSProperties => ({
    width:'100%', boxSizing:'border-box', padding:'12px 14px', borderRadius:10, fontSize:13,
    outline:'none', color:C.dark, background: hasErr?'#fff5f5':'#fafafa',
    border: hasErr ? `2px solid ${C.error}` : '1.5px solid #e8e8e8',
  });

  return (
    <div style={{ background:C.surface, minHeight:'100%', paddingBottom:32 }}>
      <div style={{ background:`linear-gradient(135deg,${C.primary} 0%,${C.secondary} 100%)`,
        padding:'52px 18px 24px', borderBottomLeftRadius:24, borderBottomRightRadius:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ width:36, height:36, borderRadius:12,
            background:'rgba(255,255,255,.35)', border:'none', display:'flex', alignItems:'center',
            justifyContent:'center', cursor:'pointer' }}>
            <ArrowLeft size={18} style={{ color:C.dark }}/>
          </button>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.dark, margin:0 }}>Upload Listing Kost</h2>
        </div>
      </div>

      <div style={{ padding:'20px 16px' }}>
        <div style={{ background:'#fff', borderRadius:16, padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>

          {/* Image Upload Area */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase',
              letterSpacing:.5, display:'block', marginBottom:8 }}>Foto Kost</label>

            {form.image
              ? <div style={{ position:'relative' }}>
                  <img src={form.image} alt="preview"
                    onError={()=>{ setImgErr(true); setForm(p=>({...p,image:''})); }}
                    style={{ width:'100%', height:160, objectFit:'cover', borderRadius:12, display:'block' }}/>
                  <button onClick={()=>setForm(p=>({...p,image:''}))}
                    style={{ position:'absolute', top:8, right:8, width:30, height:30, borderRadius:'50%',
                      background:'rgba(0,0,0,.6)', border:'none', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <X size={14} style={{ color:'#fff' }}/>
                  </button>
                  <div style={{ position:'absolute', bottom:8, left:8, background:'rgba(0,0,0,.5)',
                    borderRadius:8, padding:'3px 8px', fontSize:10, color:'#fff' }}>✓ Foto siap upload</div>
                </div>
              : <div>
                  {/* Drag-and-drop / file picker area */}
                  <label htmlFor="img-upload" style={{ display:'block', border:`2px dashed ${C.primary}`,
                    borderRadius:14, padding:'28px 16px', textAlign:'center', cursor:'pointer',
                    background:`${C.primary}08`, transition:'background .15s' }}
                    onDragOver={e=>{ e.preventDefault(); (e.currentTarget as HTMLElement).style.background=`${C.primary}18`; }}
                    onDragLeave={e=>{ (e.currentTarget as HTMLElement).style.background=`${C.primary}08`; }}
                    onDrop={e=>{
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).style.background=`${C.primary}08`;
                      const file = e.dataTransfer.files[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/')) { setImgErr(true); return; }
                      const reader = new FileReader();
                      reader.onload = ev => setForm(p=>({...p,image:ev.target?.result as string}));
                      reader.readAsDataURL(file);
                    }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>📷</div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:4 }}>
                      Tap untuk pilih foto
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>atau drag &amp; drop file ke sini</div>
                    <div style={{ marginTop:8, fontSize:10, color:C.muted }}>JPG, PNG, WebP · maks. 5 MB</div>
                    <input id="img-upload" type="file" accept="image/*" style={{ display:'none' }}
                      onChange={e=>{
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith('image/')) { setImgErr(true); return; }
                        const reader = new FileReader();
                        reader.onload = ev => setForm(p=>({...p,image:ev.target?.result as string}));
                        reader.readAsDataURL(file);
                      }}/>
                  </label>

                  {/* URL fallback */}
                  <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:1, background:'#eee' }}/>
                    <span style={{ fontSize:10, color:C.muted }}>atau pakai URL</span>
                    <div style={{ flex:1, height:1, background:'#eee' }}/>
                  </div>
                  <input value={form.image} onChange={setF('image')}
                    placeholder="https://..."
                    style={{ ...fieldStyle(), marginTop:8 }}/>
                </div>
            }
          </div>

          {/* Foto Invalid Dialog */}
          {imgErr && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000,
              display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
              <div style={{ background:'#fff', borderRadius:20, padding:'24px', maxWidth:320, width:'100%' }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:`${C.error}15`,
                  display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <AlertCircle size={26} style={{ color:C.error }}/>
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:C.dark, marginBottom:8, textAlign:'center' }}>
                  URL Foto Tidak Valid
                </div>
                <div style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.5, textAlign:'center' }}>
                  Gambar tidak dapat dimuat. Pastikan URL mengarah ke file gambar yang valid (jpg, png, webp).
                </div>
                <button onClick={()=>setImgErr(false)} style={{ width:'100%', padding:'13px', borderRadius:14,
                  border:'none', background:C.primary, color:C.dark, fontSize:13, fontWeight:800, cursor:'pointer' }}>
                  Coba URL Lain
                </button>
              </div>
            </div>
          )}

          {/* Name, Location, Campus */}
          {([
            { key:'name'            as const, label:'Nama Kost',               placeholder:'cth: Kost Putra Bahagia' },
            { key:'location'        as const, label:'Lokasi',                  placeholder:'cth: Depok, Jawa Barat'  },
            { key:'distanceToCampus'as const, label:'Jarak ke Kampus (opsional)', placeholder:'cth: 0.5 km dari UI' },
          ]).map(f=>(
            <div key={f.key} style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase',
                letterSpacing:.5, display:'block', marginBottom:6 }}>{f.label}</label>
              <input value={form[f.key]} onChange={setF(f.key)} placeholder={f.placeholder}
                style={fieldStyle(!!err[f.key])}/>
              <FieldErr msg={err[f.key]}/>
            </div>
          ))}

          {/* Price + Rooms */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase',
                letterSpacing:.5, display:'block', marginBottom:6 }}>Harga/Bulan (Rp)</label>
              <input value={form.price} onChange={setF('price')} placeholder="1500000" type="number"
                style={fieldStyle(!!err.price)}/>
              <FieldErr msg={err.price}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase',
                letterSpacing:.5, display:'block', marginBottom:6 }}>Jml. Kamar</label>
              <input value={form.totalRooms} onChange={setF('totalRooms')} placeholder="10" type="number"
                style={fieldStyle(!!err.totalRooms)}/>
              <FieldErr msg={err.totalRooms}/>
            </div>
          </div>

          {/* Type */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase',
              letterSpacing:.5, display:'block', marginBottom:6 }}>Tipe Kost</label>
            <div style={{ display:'flex', gap:8 }}>
              {(['putra','putri','campur'] as const).map(t=>(
                <button key={t} onClick={()=>setForm(p=>({...p,type:t}))}
                  style={{ flex:1, padding:'10px', borderRadius:10, border:'none', cursor:'pointer',
                    background: form.type===t ? C.primary : '#f5f5f5',
                    color: form.type===t ? C.dark : C.muted,
                    fontWeight:700, fontSize:11, transition:'all .15s' }}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase',
              letterSpacing:.5, display:'block', marginBottom:8 }}>Fasilitas</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {ALL_FACILITIES.map(f=>(
                <button key={f} onClick={()=>togFac(f)}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 12px',
                    borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
                    background: form.facilities.includes(f) ? C.primary : '#f0f0f0',
                    color: form.facilities.includes(f) ? C.dark : '#666', transition:'all .15s' }}>
                  {FACI_ICON[f]??null}{f}
                </button>
              ))}
            </div>
            <FieldErr msg={err.facilities}/>
          </div>

          {/* Description */}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase',
              letterSpacing:.5, display:'block', marginBottom:6 }}>Deskripsi</label>
            <textarea value={form.description}
              onChange={e=>setForm(p=>({...p,description:e.target.value}))}
              placeholder="Ceritakan tentang kost kamu..." rows={3}
              style={{ ...fieldStyle(), resize:'vertical', fontFamily:'inherit' }}/>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onBack} style={{ flex:1, padding:'14px', borderRadius:20,
              border:`2px solid ${C.primary}`, background:'#fff', color:C.dark,
              fontSize:13, fontWeight:700, cursor:'pointer' }}>
              Simpan Draft
            </button>
            <button onClick={save} disabled={busy}
              style={{ flex:2, padding:'16px', borderRadius:20, border:'none',
                background: busy?'#f0d000':C.primary, color:C.dark, fontSize:14, fontWeight:800,
                cursor:'pointer', boxShadow:`0 6px 20px ${C.primary}50`, opacity: busy?.8:1 }}>
              {busy ? 'Menyimpan...' : 'UPLOAD LISTING'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════ */
function ProfileView({ user, onLogout, onEdit }:{
  user:AppUser; onLogout:()=>void; onEdit:(u:AppUser)=>void;
}) {
  const [notif,       setNotif]       = useState(true);
  const [editing,     setEditing]     = useState(false);
  const [form,        setForm]        = useState({ name:user.name, phone:user.phone });
  const [busy,        setBusy]        = useState(false);
  const [ownerDialog, setOwnerDialog] = useState(false);
  const [downgrade,   setDowngrade]   = useState(false);
  const [logoutDlg,   setLogoutDlg]   = useState(false);

  const save = () => {
    if (!form.name.trim()) return;
    setBusy(true);
    setTimeout(()=>{
      const updated = DB.updateUser(user.id, { name:form.name.trim(), phone:form.phone.trim() });
      DB.saveSession(updated);
      setBusy(false); setEditing(false); onEdit(updated);
    }, 500);
  };

  const activateOwner = () => {
    const updated = DB.updateUser(user.id, { role:'owner' });
    DB.saveSession(updated);
    setOwnerDialog(false);
    onEdit(updated);
  };

  const deactivateOwner = () => {
    const updated = DB.updateUser(user.id, { role:'seeker' });
    DB.saveSession(updated);
    setDowngrade(false);
    onEdit(updated);
  };

  return (
    <div style={{ background:C.surface, minHeight:'100%', padding:'52px 16px 24px' }}>
      {/* Avatar card */}
      <div style={{ background:'#fff', borderRadius:16, padding:'20px', marginBottom:14,
        boxShadow:'0 2px 12px rgba(0,0,0,.05)', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', overflow:'hidden', flexShrink:0 }}>
          <img src={`https://i.pravatar.cc/150?u=${user.email}`} alt="user"
            style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        </div>
        <div style={{ flex:1 }}>
          {editing
            ? <div>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  style={{ width:'100%', boxSizing:'border-box', padding:'8px 10px', borderRadius:8,
                    border:`1.5px solid ${C.primary}`, fontSize:14, fontWeight:700, outline:'none', marginBottom:6 }}/>
                <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}
                  style={{ width:'100%', boxSizing:'border-box', padding:'8px 10px', borderRadius:8,
                    border:'1.5px solid #e0e0e0', fontSize:12, outline:'none' }}/>
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <button onClick={()=>setEditing(false)}
                    style={{ flex:1, padding:'8px', borderRadius:8, border:'1.5px solid #e0e0e0',
                      background:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', color:C.muted }}>Batal</button>
                  <button onClick={save} disabled={busy}
                    style={{ flex:1, padding:'8px', borderRadius:8, border:'none',
                      background:C.primary, fontSize:11, fontWeight:700, cursor:'pointer', color:C.dark }}>
                    {busy?'...':'Simpan'}
                  </button>
                </div>
              </div>
            : <>
                <div style={{ fontSize:18, fontWeight:800, color:C.dark }}>{user.name}</div>
                <div style={{ fontSize:12, color:C.muted }}>{user.email}</div>
                <div style={{ fontSize:12, color:C.muted }}>{user.phone}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20,
                    background: user.role==='owner' ? `${C.primary}30` : '#f0f0f0',
                    color: user.role==='owner' ? '#7a5c00' : C.muted, display:'inline-block' }}>
                    {user.role==='owner' ? '🏘️ Pemilik Kost' : '🔍 Pencari Kost'}
                  </span>
                  <button onClick={()=>setEditing(true)}
                    style={{ fontSize:11, fontWeight:700, color:C.primary, background:'none',
                      border:'none', cursor:'pointer' }}>Edit Profil</button>
                </div>
              </>
          }
        </div>
      </div>

      {/* ── OWNER UPGRADE / DOWNGRADE CARD ── */}
      {user.role==='seeker' ? (
        <div style={{ background:`linear-gradient(135deg,${C.primary} 0%,${C.secondary} 100%)`,
          borderRadius:16, padding:'18px 20px', marginBottom:14,
          boxShadow:`0 4px 20px ${C.primary}40` }}>
          <div style={{ fontSize:14, fontWeight:800, color:C.dark, marginBottom:4 }}>
            🏘️ Punya Kost untuk Disewakan?
          </div>
          <div style={{ fontSize:11, color:'rgba(26,26,26,.65)', marginBottom:14, lineHeight:1.6 }}>
            Aktifkan fitur Pemilik Kost dan mulai iklankan propertimu di PapiKost. Kamu tetap bisa mencari kost seperti biasa.
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:4 }}>
            {['✓ Upload listing gratis','✓ Kelola booking','✓ Pantau hunian'].map(f=>(
              <span key={f} style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:20,
                background:'rgba(255,255,255,.5)', color:C.dark }}>{f}</span>
            ))}
          </div>
          <button onClick={()=>setOwnerDialog(true)}
            style={{ marginTop:12, width:'100%', padding:'12px', borderRadius:14, border:'none',
              background:C.dark, color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer' }}>
            AKTIFKAN FITUR PEMILIK KOST
          </button>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:16, padding:'16px 18px', marginBottom:14,
          boxShadow:'0 2px 12px rgba(0,0,0,.05)', border:`1.5px solid ${C.primary}40` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.dark }}>🏘️ Fitur Pemilik Kost Aktif</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                Kamu bisa mencari kost sekaligus mengelola propertimu
              </div>
            </div>
            <span style={{ fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:20,
              background:`${C.success}18`, color:C.success }}>Aktif</span>
          </div>
          <button onClick={()=>setDowngrade(true)}
            style={{ marginTop:12, width:'100%', padding:'10px', borderRadius:12, border:'none',
              background:'#f5f5f5', color:C.muted, fontSize:11, fontWeight:700, cursor:'pointer' }}>
            Nonaktifkan Fitur Pemilik
          </button>
        </div>
      )}

      {/* Settings */}
      <div style={{ background:'#fff', borderRadius:16, overflow:'hidden',
        boxShadow:'0 2px 12px rgba(0,0,0,.05)', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px', borderBottom:'1px solid #f5f5f5' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Bell size={18} style={{ color:C.muted }}/>
            <span style={{ fontSize:13, color:C.dark }}>Notifikasi Push</span>
          </div>
          <div onClick={()=>setNotif(n=>!n)} style={{ width:44, height:24, borderRadius:12,
            background: notif?C.primary:'#ddd', cursor:'pointer', position:'relative', transition:'background .2s' }}>
            <div style={{ position:'absolute', top:2, left: notif?22:2, width:20, height:20,
              borderRadius:'50%', background:'#fff', transition:'left .2s',
              boxShadow:'0 1px 4px rgba(0,0,0,.2)' }}/>
          </div>
        </div>
        <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
          <Mail size={18} style={{ color:C.muted }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:C.dark }}>Email terdaftar</div>
            <div style={{ fontSize:11, color:C.muted }}>{user.email}</div>
          </div>
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:16, padding:'14px 16px',
        boxShadow:'0 2px 12px rgba(0,0,0,.05)', marginBottom:12,
        fontSize:11, color:C.muted, lineHeight:1.7 }}>
        <div style={{ fontWeight:700, color:C.dark, fontSize:12, marginBottom:4 }}>Tentang Akun</div>
        Bergabung sejak {new Date(user.createdAt).toLocaleDateString('id-ID',
          { year:'numeric', month:'long', day:'numeric' })}.<br/>
        Data tersimpan secara lokal di browser ini.
      </div>

      <button onClick={()=>setLogoutDlg(true)} style={{ width:'100%', padding:'14px', borderRadius:16, border:'none',
        cursor:'pointer', color:C.error, background:`${C.error}10`, fontSize:13, fontWeight:700 }}>
        Keluar Akun
      </button>

      {/* Logout Dialog */}
      {logoutDlg && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:'24px', maxWidth:320, width:'100%' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:`${C.error}15`,
              display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:C.dark, marginBottom:8, textAlign:'center' }}>Keluar Akun?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.5, textAlign:'center' }}>
              Kamu perlu login kembali untuk mengakses PapiKost.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setLogoutDlg(false)} style={{ flex:1, padding:'12px', borderRadius:12,
                border:`2px solid ${C.primary}`, background:'#fff', color:C.dark, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Batal
              </button>
              <button onClick={onLogout} style={{ flex:1, padding:'12px', borderRadius:12, border:'none',
                background:C.error, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Owner Dialog */}
      {ownerDialog && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:'28px 24px 40px',
            width:'100%', maxWidth:430 }}>
            <div style={{ width:40, height:4, borderRadius:4, background:'#e0e0e0',
              margin:'0 auto 20px' }}/>
            <div style={{ fontSize:20, fontWeight:900, color:C.dark, marginBottom:8 }}>
              🏘️ Aktifkan Fitur Pemilik Kost
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:20 }}>
              Dengan mengaktifkan fitur ini, kamu akan mendapatkan tab <b>Kos Saya</b> di navigasi bawah untuk mengelola properti dan booking.
              <br/><br/>
              Kamu <b>tetap bisa</b> mencari kost, menyimpan favorit, dan menggunakan semua fitur seeker seperti biasa.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {['Upload listing kost gratis','Terima & konfirmasi booking','Pantau hunian real-time','Lihat riwayat semua booking masuk'].map(f=>(
                <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:C.dark }}>
                  <CheckCircle2 size={15} style={{ color:C.success, flexShrink:0 }}/>{f}
                </div>
              ))}
            </div>
            <button onClick={activateOwner}
              style={{ width:'100%', padding:'16px', borderRadius:20, border:'none',
                background:C.primary, color:C.dark, fontSize:14, fontWeight:800,
                cursor:'pointer', boxShadow:`0 6px 20px ${C.primary}50`, marginBottom:10 }}>
              AKTIFKAN SEKARANG
            </button>
            <button onClick={()=>setOwnerDialog(false)}
              style={{ width:'100%', padding:'12px', borderRadius:14, border:'none',
                background:'none', color:C.muted, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Deactivate Owner Dialog */}
      {downgrade && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:'24px', maxWidth:320, width:'100%' }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.dark, marginBottom:8 }}>
              Nonaktifkan Fitur Pemilik?
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.5, marginBottom:20 }}>
              Tab Kos Saya akan disembunyikan. Data listing dan booking yang ada tidak akan dihapus.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setDowngrade(false)}
                style={{ flex:1, padding:'12px', borderRadius:12, border:`2px solid ${C.primary}`,
                  background:'#fff', color:C.dark, fontSize:13, fontWeight:700, cursor:'pointer' }}>Batal</button>
              <button onClick={deactivateOwner}
                style={{ flex:1, padding:'12px', borderRadius:12, border:'none',
                  background:'#f5f5f5', color:C.muted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   FAB HELP
══════════════════════════════════════════════ */
function FabHelp({ visible }:{ visible:boolean }) {
  const [open, setOpen] = useState(false);
  if (!visible) return null;
  const items = [
    { icon:'💬', label:'Chat CS – Fast Response', sub:'Balas dalam < 5 menit', bg:C.dark, color:'#fff', action:()=>window.open('https://wa.me/6281200000000?text=Halo CS PapiKost') },
    { icon:'❓', label:'FAQ – Cari Solusi',        sub:'100+ pertanyaan umum',  bg:'#f5f5f5', color:C.dark, action:()=>{} },
    { icon:'🚨', label:'Laporkan Masalah',          sub:'Bug atau keluhan layanan', bg:'#f5f5f5', color:C.dark, action:()=>{} },
    { icon:'📍', label:'Agen Terdekat',              sub:'Temukan agen PapiKost di kotamu', bg:'#f5f5f5', color:C.dark, action:()=>{} },
  ];
  return (
    <>
      {open && <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:998 }}/>}
      <div style={{ position:'fixed', bottom:90, right:20, zIndex:999 }}>
        <button onClick={()=>setOpen(o=>!o)} style={{ width:52, height:52, borderRadius:'50%',
          background: open ? '#333' : C.dark, border:'none', display:'flex', alignItems:'center',
          justifyContent:'center', cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,.3)',
          transition:'background .2s' }}>
          {open ? <X size={22} style={{ color:'#fff' }}/> : <HelpCircle size={22} style={{ color:'#fff' }}/>}
        </button>
      </div>

      {/* Bottom Sheet */}
      {open && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:999,
          background:'#fff', borderRadius:'24px 24px 0 0', padding:'0 20px 48px',
          boxShadow:'0 -4px 32px rgba(0,0,0,.15)' }}>
          <div style={{ width:40, height:4, borderRadius:4, background:'#e0e0e0', margin:'12px auto 20px' }}/>
          <div style={{ fontSize:17, fontWeight:800, color:C.dark, marginBottom:16 }}>🆘 Pusat Bantuan</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {items.map(it=>(
              <button key={it.label} onClick={()=>{ it.action(); setOpen(false); }}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
                  borderRadius:14, border:'none', background:it.bg, cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{it.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:it.color }}>{it.label}</div>
                  <div style={{ fontSize:11, color: it.bg===C.dark?'rgba(255,255,255,.6)':C.muted, marginTop:2 }}>{it.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════
   APP ROOT
══════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState<Screen|null>('splash');
  const [user,   setUser]   = useState<AppUser|null>(null);
  const [nav,    setNav]    = useState<View>('home');
  const [view,   setView]   = useState<View>('home');
  const [listing,setListing]= useState<Listing|null>(null);
  const [favs,   setFavs]   = useState<string[]>([]);
  const [refresh,setRefresh]= useState(0);

  useEffect(()=>{
    const session = DB.getSession();
    if (session) { setUser(session); setFavs(DB.getUserFavs(session.id)); setScreen(null); }
    const handler = ()=>setRefresh(r=>r+1);
    window.addEventListener('pk_refresh', handler);
    return ()=>window.removeEventListener('pk_refresh', handler);
  },[]);

  const login = (u:AppUser) => {
    setUser(u); setFavs(DB.getUserFavs(u.id));
    setScreen(null); setNav('home'); setView('home');
  };

  const logout = () => {
    DB.clearSession(); setUser(null); setFavs([]);
    setScreen('login'); setNav('home'); setView('home');
  };

  const toggleFav = useCallback((id:string)=>{
    if (!user) return;
    setFavs(DB.toggleFav(user.id, id));
  },[user]);

  const goNav = (v:View) => { setNav(v); setView(v); };
  const openListing = (l:Listing) => { setListing(l); setView('detail'); };
  const goApartment = () => setView('apartment');

  const CSS = `
    @keyframes sk{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes popIn{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}
    @keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
    @keyframes progBar{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
    *{-webkit-tap-highlight-color:transparent;}
    ::-webkit-scrollbar{display:none}
    input[type=date]::-webkit-calendar-picker-indicator{opacity:.5}
  `;

  const wrap = (ch:React.ReactNode) => (
    <div style={{ maxWidth:430, margin:'0 auto', minHeight:'100vh', background:'#fff',
      position:'relative', overflow:'hidden' }}>
      <style>{CSS}</style>
      {ch}
    </div>
  );

  if (screen==='splash')   return wrap(<SplashScreen onDone={()=>setScreen('login')}/>);
  if (screen==='login')    return wrap(<div style={{ minHeight:'100vh', overflowY:'auto' }}>
    <LoginScreen onLogin={login} onGoRegister={()=>setScreen('register')}/></div>);
  if (screen==='register') return wrap(<div style={{ minHeight:'100vh', overflowY:'auto' }}>
    <RegisterScreen onRegister={login} onGoLogin={()=>setScreen('login')}/></div>);
  if (!user) return wrap(<SplashScreen onDone={()=>setScreen('login')}/>);

  const showNav = view!=='booking' && view!=='add-listing' && view!=='apartment';

  const renderView = () => {
    if (view==='detail' && listing)
      return <DetailView l={listing} onBack={()=>setView(nav==='apartment'?'apartment':nav)}
        onBooking={()=>setView('booking')} isFav={favs.includes(listing.id)} onFav={toggleFav}/>;
    if (view==='booking' && listing)
      return <BookingView listing={listing} user={user} onBack={()=>setView('detail')}
        onSuccess={()=>{ setRefresh(r=>r+1); goNav('dashboard'); }}/>;
    if (view==='add-listing')
      return <AddListingView user={user} onBack={()=>setView('dashboard')}
        onSaved={()=>{ setRefresh(r=>r+1); goNav('dashboard'); }}/>;
    if (view==='apartment')
      return <ApartmentView onBack={()=>{ setNav('home'); setView('home'); }}
        onListingClick={l=>{setListing(l);setView('detail');}}
        favorites={favs} onFav={toggleFav}/>;
    if (nav==='favorites')
      return <FavoritesView favorites={favs} onListingClick={openListing} onFav={toggleFav}/>;
    if (nav==='dashboard')
      return user.role==='owner'
        ? <OwnerDashboard user={user} refresh={refresh} onAddListing={()=>setView('add-listing')}/>
        : <MyBookingsView user={user} refresh={refresh} onListingClick={openListing}/>;
    if (nav==='profile')
      return <ProfileView user={user} onLogout={logout} onEdit={u=>setUser(u)}/>;
    return <HomeView user={user} onListingClick={openListing} favorites={favs}
      onFav={toggleFav} refresh={refresh} onGoApartment={goApartment}/>;
  };

  return wrap(
    <>
      <div style={{ paddingBottom: showNav?72:0, minHeight:'100vh', overflowY:'auto' }}>
        {renderView()}
      </div>
      {showNav && (
        <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
          width:'100%', maxWidth:430, background:'#fff', borderTop:'1px solid #f0f0f0',
          boxShadow:'0 -2px 10px rgba(0,0,0,.05)', display:'flex', justifyContent:'space-around',
          alignItems:'center', paddingTop:10, paddingBottom:20, zIndex:999 }}>
          <NavBtn icon={<HomeIcon size={22}/>}    label="Beranda"  active={nav==='home'}      onClick={()=>goNav('home')}/>
          <NavBtn icon={<Heart size={22}/>}       label="Favorit"  active={nav==='favorites'} onClick={()=>goNav('favorites')}/>
          <NavBtn icon={<ClipboardList size={22}/>} label="Booking" active={nav==='dashboard' && user.role==='seeker'} onClick={()=>goNav('dashboard')}/>
          {user.role==='owner' && (
            <NavBtn icon={<LayoutDashboard size={22}/>} label="Kos Saya"
              active={nav==='dashboard' && user.role==='owner'} onClick={()=>goNav('dashboard')}/>
          )}
          <NavBtn icon={<User size={22}/>}        label="Profil"   active={nav==='profile'}   onClick={()=>goNav('profile')}/>
        </nav>
      )}
      <FabHelp visible={showNav}/>
    </>
  );
}
