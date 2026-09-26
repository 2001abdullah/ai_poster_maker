"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, CircleHelp, Clock3, FileImage, Flag, ImagePlus, LayoutTemplate, LoaderCircle, Menu, Plus, RefreshCw, RotateCcw, Sparkles, Trash2, Upload, UserRound, X } from "lucide-react";

type Occasion = "victory" | "tribute" | "campaign";
type Photo = { name: string; dataUrl: string; file: File };
type Account = { id: string; name: string; email: string };
type HistoryItem = { _id: string; formData: { headline: string; name: string }; createdAt: string; generatedImageUrl: string | null; status: string; retryCount: number };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
const apiOrigin = apiUrl.startsWith("http") ? new URL(apiUrl).origin : "";
const occasions: { id: Occasion; title: string; subtitle: string }[] = [
  { id: "victory", title: "বিজয় দিবস", subtitle: "National occasion" },
  { id: "tribute", title: "শ্রদ্ধাঞ্জলি", subtitle: "Tribute & remembrance" },
  { id: "campaign", title: "নির্বাচনী প্রচার", subtitle: "Campaign" },
];
const samplePhoto = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 360'%3E%3Crect width='300' height='360' fill='%23d9e7dc'/%3E%3Ccircle cx='150' cy='119' r='62' fill='%23c58b68'/%3E%3Cpath d='M82 112c5-77 128-98 143-3-27-22-83-32-143 3' fill='%232a3c32'/%3E%3Cpath d='M57 360c2-99 45-154 93-154s91 55 93 154' fill='%232c5040'/%3E%3Cpath d='M127 220h46l-23 44z' fill='%23f5f1e7'/%3E%3C/svg%3E";

export default function Home() {
  const [occasion, setOccasion] = useState<Occasion>("victory");
  const [name, setName] = useState("মোঃ রফিকুল ইসলাম");
  const [designation, setDesignation] = useState("সাধারণ সম্পাদক");
  const [organization, setOrganization] = useState("বাংলাদেশ জাতীয়তাবাদী দল");
  const [location, setLocation] = useState("ধানমন্ডি, ঢাকা");
  const [headline, setHeadline] = useState("মহান বিজয় দিবস");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyAction, setHistoryAction] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const activeOccasion = occasions.find((item) => item.id === occasion)!;

  useEffect(() => {
    fetch(`${apiUrl}/auth/me`, { credentials: "include" })
      .then(async (response) => response.ok ? (await response.json()).user as Account : null)
      .then((user) => { if (user) setAccount(user); })
      .catch(() => undefined);
  }, []);

  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []).slice(0, 3 - photos.length);
    const valid = selected.filter((file) => file.type.startsWith("image/") && file.size <= 8 * 1024 * 1024);
    Promise.all(valid.map((file) => new Promise<Photo>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, dataUrl: String(reader.result), file });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }))).then((added) => setPhotos((current) => [...current, ...added].slice(0, 3))).catch(() => setNotice("ছবিটি পড়া যায়নি। অন্য একটি ছবি চেষ্টা করুন।"));
    event.target.value = "";
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/auth/${authMode === "register" ? "register" : "login"}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authMode === "register" ? { name: authName, email: authEmail, password: authPassword } : { email: authEmail, password: authPassword }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not sign in");
      setAccount(payload.user as Account);
      setAuthOpen(false);
      setAuthPassword("");
      setNotice(`Signed in as ${payload.user.name}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Account service is unavailable.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function loadHistory() {
    if (!account) {
      setAuthOpen(true);
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/posters`, { credentials: "include" });
      if (!response.ok) throw new Error("Could not load poster history");
      const payload = await response.json();
      setHistory(payload.posters as HistoryItem[]);
      setHistoryOpen(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Poster history is unavailable.");
    }
  }

  async function downloadAsset(path: string, fileName: string) {
    const response = await fetch(`${apiOrigin}${path}`, { credentials: "include" });
    if (!response.ok) throw new Error("The saved poster could not be downloaded.");
    const objectUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function regenerateHistory(item: HistoryItem) {
    setHistoryAction(item._id);
    try {
      const response = await fetch(`${apiUrl}/posters/${item._id}/regenerate`, { method: "POST", credentials: "include" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Poster could not be regenerated");
      await downloadAsset(payload.poster.generatedImageUrl as string, "poster-maker.png");
      const historyResponse = await fetch(`${apiUrl}/posters`, { credentials: "include" });
      if (historyResponse.ok) setHistory((await historyResponse.json()).posters as HistoryItem[]);
      setNotice("নতুন পোস্টারটি তৈরি এবং ডাউনলোড হয়েছে।");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Poster could not be regenerated.");
    } finally {
      setHistoryAction("");
    }
  }

  async function deleteHistory(item: HistoryItem) {
    setHistoryAction(item._id);
    try {
      const response = await fetch(`${apiUrl}/posters/${item._id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Poster could not be deleted");
      setHistory((current) => current.filter((poster) => poster._id !== item._id));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Poster could not be deleted.");
    } finally {
      setHistoryAction("");
    }
  }

  async function savePosterToHistory(): Promise<string> {
    const photoKeys: string[] = [];
    for (const photo of photos) {
      const body = new FormData();
      body.append("photo", photo.file);
      const uploadResponse = await fetch(`${apiUrl}/uploads`, { method: "POST", credentials: "include", body });
      const uploadPayload = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadPayload.error ?? "Photo upload failed");
      photoKeys.push(uploadPayload.asset.key as string);
    }
    const response = await fetch(`${apiUrl}/posters`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateSlug: occasion === "tribute" ? "tribute" : occasion === "campaign" ? "campaign" : "victory-day",
        formData: { name, designation, organization, location, headline },
        photoKeys,
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Poster could not be saved");
    return payload.poster.generatedImageUrl as string;
  }

  async function exportPoster() {
    setBusy(true);
    setNotice("");
    try {
      const width = 800;
      const height = 1000;
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare this poster.");
      await document.fonts.ready;
      context.scale(2, 2);
      const footerColor = occasion === "tribute" ? "#45604f" : "#176b4b";
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, occasion === "tribute" ? "#eee8df" : "#f7f2e7");
      gradient.addColorStop(1, "#d4e4ce");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.fillStyle = occasion === "tribute" ? "#71826d" : "#d52731";
      context.fillRect(0, 0, width, 14);
      context.fillStyle = footerColor;
      context.fillRect(0, height - 150, width, 150);
      context.fillStyle = "#006a4e";
      context.beginPath();
      context.arc(400, 245, 150, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#f42a41";
      context.beginPath();
      context.arc(400, 245, 70, 0, Math.PI * 2);
      context.fill();
      const images = await Promise.all((photos.length ? photos : [{ name: "sample", dataUrl: samplePhoto }]).map((photo) => {
        const image = new window.Image();
        image.src = photo.dataUrl;
        return new Promise<HTMLImageElement>((resolve, reject) => { image.onload = () => resolve(image); image.onerror = () => reject(new Error("Could not load an uploaded photo.")); });
      }));
      const photoWidth = images.length === 1 ? 250 : 190;
      const photoHeight = 260;
      const gap = 20;
      const startX = (width - (photoWidth * images.length + gap * (images.length - 1))) / 2;
      images.forEach((image, index) => {
        const x = startX + index * (photoWidth + gap);
        context.save();
        context.beginPath();
        context.roundRect(x, 58, photoWidth, photoHeight, 120);
        context.clip();
        context.drawImage(image, x, 58, photoWidth, photoHeight);
        context.restore();
        context.strokeStyle = "#fffdf6";
        context.lineWidth = 8;
        context.beginPath();
        context.roundRect(x, 58, photoWidth, photoHeight, 120);
        context.stroke();
      });
      context.textAlign = "center";
      context.fillStyle = "#173d30";
      context.font = "700 58px 'Noto Sans Bengali', sans-serif";
      context.fillText(headline || activeOccasion.title, 400, 500, 700);
      context.fillStyle = "#3d5748";
      context.font = "400 27px 'Noto Sans Bengali', sans-serif";
      context.fillText(activeOccasion.title, 400, 552, 700);
      context.fillStyle = "#fffdf6";
      context.font = "700 32px 'Noto Sans Bengali', sans-serif";
      context.fillText(name || "আপনার নাম", 400, 900, 700);
      context.font = "400 22px 'Noto Sans Bengali', sans-serif";
      context.fillText(`${designation} · ${organization}`, 400, 940, 700);
      context.font = "400 18px 'Noto Sans Bengali', sans-serif";
      context.fillText(`প্রচারে: ${name} · ${location}`, 400, 975, 700);
      const anchor = document.createElement("a");
      anchor.download = "poster-maker.png";
      if (account) {
        try {
          const imagePath = await savePosterToHistory();
          await downloadAsset(imagePath, "poster-maker.png");
          setNotice("পোস্টারটি PNG হিসেবে ডাউনলোড হয়েছে এবং আপনার ইতিহাসে সংরক্ষিত হয়েছে।");
        } catch (error) {
          anchor.href = canvas.toDataURL("image/png");
          anchor.click();
          setNotice(`Preview PNG downloaded. ${error instanceof Error ? error.message : "History save failed."}`);
        }
      } else {
        anchor.href = canvas.toDataURL("image/png");
        anchor.click();
        setNotice("পোস্টারটি PNG হিসেবে ডাউনলোড হয়েছে। ইতিহাসে রাখতে সাইন ইন করুন।");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "পোস্টার তৈরি করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  return <main className="studio-shell">
    <aside className="sidebar">
      <a className="brand" href="#studio" aria-label="Poster Press home"><span className="brand-mark"><Flag size={18} strokeWidth={2.4} /></span><span>poster<span className="brand-light">press</span><small>বাংলাদেশ</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation"><a className="nav-item active" href="#studio"><Sparkles size={17} /> Create poster</a><a className="nav-item" href="#templates"><LayoutTemplate size={17} /> Templates <span className="nav-count">03</span></a><button className="nav-item" type="button" onClick={loadHistory}><Clock3 size={17} /> My posters</button></nav>
      <div className="sidebar-bottom"><div className="credit-card"><span className="credit-icon"><Sparkles size={15} /></span><div><strong>Studio</strong><small>Free preview export</small></div><ArrowRight size={15} /></div><button className="profile-button" type="button" onClick={() => account ? void fetch(`${apiUrl}/auth/logout`, { method: "POST", credentials: "include" }).then(() => setAccount(null)) : setAuthOpen(true)}><span className="profile-avatar"><UserRound size={17} /></span><span><strong>{account?.name ?? "Guest workspace"}</strong><small>{account?.email ?? "Sign in to save posters"}</small></span><ChevronDown size={15} /></button></div>
    </aside>
    <section className="main-panel" id="studio">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark"><Flag size={16} /></span> posterpress</div><button className="icon-button mobile-menu" aria-label="Open menu" type="button"><Menu size={19} /></button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Create poster</strong></div><div className="topbar-actions"><button className="help-button" type="button" onClick={() => setAuthOpen(true)}><CircleHelp size={16} /> {account ? account.name : "Sign in"}</button><span className="topbar-divider" /><button className="top-avatar" aria-label="Account" type="button" onClick={() => setAuthOpen(true)}>{account?.name.charAt(0).toUpperCase() ?? "R"}</button></div></header>
      <div className="content-wrap">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> POSTER STUDIO <span className="eyebrow-line" /></div><h1>Make it <em>matter.</em></h1><p>একটি পোস্টার, আপনার বার্তা। শুরু করুন আপনার তথ্য দিয়ে।</p></div><button className="draft-button" type="button"><span className="saved-dot" /> Draft saved <ChevronDown size={15} /></button></div>
        <div className="editor-grid">
          <section className="form-panel" aria-labelledby="details-title">
            <div className="step-row"><div className="step-current"><span>01</span><div><strong>Your details</strong><small>Tell us who this is for</small></div></div><div className="step-next"><span>02</span><strong>Style & photos</strong></div><div className="step-next"><span>03</span><strong>Preview</strong></div></div>
            <div className="form-section-title"><div><span className="section-number">01</span><h2 id="details-title">Poster details</h2></div><span className="required-label">* Required fields</span></div>
            <div className="field-label">Occasion <span>*</span></div>
            <div className="occasion-grid" role="group" aria-label="Choose poster occasion">{occasions.map((item, index) => <button className={`occasion-option ${occasion === item.id ? "selected" : ""}`} key={item.id} type="button" onClick={() => { setOccasion(item.id); setHeadline(item.id === "tribute" ? "গভীর শ্রদ্ধাঞ্জলি" : item.id === "campaign" ? "টেক ব্যাক বাংলাদেশ" : "মহান বিজয় দিবস"); }}><span className={`occasion-symbol symbol-${index}`}>{index === 0 ? "১৬" : index === 1 ? "✳" : "▤"}</span><span className="occasion-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></span>{occasion === item.id && <span className="selected-check"><Check size={13} /></span>}</button>)}</div>
            <div className="fields-grid">
              <label className="field"><span>Your name <b>*</b></span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="আপনার নাম" maxLength={80} /></label>
              <label className="field"><span>Designation / পদবি</span><input value={designation} onChange={(event) => setDesignation(event.target.value)} placeholder="যেমন: সভাপতি" maxLength={80} /></label>
              <label className="field"><span>Party / organization</span><input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="দল বা সংগঠনের নাম" maxLength={100} /></label>
              <label className="field"><span>Area / এলাকা</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="ইউনিয়ন, থানা, জেলা" maxLength={100} /></label>
              <label className="field full-field"><span>Headline <b>*</b><small>Bangla text is typeset exactly as entered</small></span><input value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="পোস্টারের শিরোনাম লিখুন" maxLength={120} /></label>
            </div>
            <div className="upload-heading"><div className="field-label">Leader photos <small>Optional · up to 3 photos</small></div><button className="text-button" type="button" onClick={() => inputRef.current?.click()}><Plus size={15} /> Add photo</button></div>
            <div className="upload-row">{photos.map((photo, index) => <div className="photo-thumb" key={`${photo.name}-${index}`}><Image src={photo.dataUrl} alt={`Uploaded portrait ${index + 1}`} fill sizes="53px" className="object-cover" /><button type="button" onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))} aria-label={`Remove ${photo.name}`}><X size={13} /></button></div>)}{photos.length < 3 && <button className="upload-tile" type="button" onClick={() => inputRef.current?.click()}><ImagePlus size={18} /><span>Upload a photo</span><small>PNG or JPG · max 8 MB</small></button>}{photos.length === 0 && <div className="photo-guidance"><span className="guide-icon"><Upload size={16} /></span><div><strong>Portrait cutouts look best</strong><small>Use a clear, front-facing photo with good lighting.</small></div></div>}</div>
            <input ref={inputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={addPhotos} />
            {notice && <div className="notice" role="status">{notice}</div>}
            <div className="form-footer"><span><CircleHelp size={14} /> You can edit every detail before export.</span><button className="generate-button" type="button" onClick={exportPoster} disabled={busy || !name.trim() || !headline.trim()}>{busy ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}{busy ? "Preparing..." : "Generate poster"}<ArrowRight size={16} /></button></div>
          </section>
          <aside className="preview-panel" aria-label="Live poster preview">
            <div className="preview-topline"><div><span className="preview-label">LIVE PREVIEW</span><span className="preview-status"><span /> Auto-updating</span></div><button className="preview-more" aria-label="Preview options" type="button"><ChevronDown size={16} /></button></div>
            <div className={`poster-art poster-${occasion}`} id="poster-preview"><div className="poster-grain" /><div className="poster-top-rule" /><div className="poster-sun"><span /></div><div className="poster-portraits">{(photos.length ? photos : [{ name: "sample", dataUrl: samplePhoto }]).map((photo, index) => <div className="poster-portrait" key={`${photo.name}-${index}`}><Image src={photo.dataUrl} alt="Poster portrait preview" fill sizes="(max-width: 620px) 30vw, 18vw" className="object-cover" /></div>)}</div><div className="poster-copy"><div className="poster-kicker">{activeOccasion.subtitle.toUpperCase()} · ২০২৬</div><h2>{headline || "আপনার শিরোনাম"}</h2><div className="poster-flourish"><span /><i>◆</i><span /></div><p>{occasion === "campaign" ? "জনতার অধিকার, জনতার বাংলাদেশ" : occasion === "tribute" ? "আপনার অবদান আমরা শ্রদ্ধায় স্মরণ করি" : "স্বাধীনতার চেতনায় এগিয়ে চলি"}</p></div><div className="poster-footer"><strong>{name || "আপনার নাম"}</strong><span>{designation}{designation && organization ? " · " : ""}{organization}</span><small>প্রচারে: {name || "আপনার নাম"} · {location}</small></div><div className="poster-seal"><span className="seal-green"><i /></span></div></div>
            <div className="preview-meta"><span><FileImage size={15} /> Portrait · 4:5</span><span>1600 × 2000 px</span></div><button className="download-button" type="button" onClick={exportPoster} disabled={busy}><ArrowDownToLine size={16} /> Download PNG <span>High resolution</span></button><div className="regen-note"><RotateCcw size={14} /><span>Bangla text · 1600 × 2000 px</span></div>
          </aside>
        </div>
        <footer className="page-footer"><span>Designed for Bangladesh.</span><span><span className="footer-dot" /> Your text stays yours</span></footer>
      </div>
    </section>
    {authOpen && <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}><section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" type="button" aria-label="Close" onClick={() => setAuthOpen(false)}><X size={17} /></button><span className="modal-kicker">POSTER PRESS ACCOUNT</span><h2 id="auth-title">{authMode === "register" ? "Create your account" : "Welcome back"}</h2><p>Keep your posters together and download them again anytime.</p><form onSubmit={submitAuth}>{authMode === "register" && <label className="field"><span>Name</span><input required minLength={2} maxLength={80} value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="name" /></label>}<label className="field"><span>Email</span><input required type="email" maxLength={254} value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" /></label><label className="field"><span>Password <small>{authMode === "register" ? "At least 10 characters" : ""}</small></span><input required type="password" minLength={authMode === "register" ? 10 : 1} maxLength={128} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} autoComplete={authMode === "register" ? "new-password" : "current-password"} /></label><button className="generate-button modal-submit" type="submit" disabled={authBusy}>{authBusy ? "Please wait..." : authMode === "register" ? "Create account" : "Sign in"}<ArrowRight size={15} /></button></form><button className="modal-switch" type="button" onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}>{authMode === "register" ? "Already registered? Sign in" : "New here? Create an account"}</button></section></div>}
    {historyOpen && <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setHistoryOpen(false); }}><section className="account-modal history-modal" role="dialog" aria-modal="true" aria-labelledby="history-title"><button className="modal-close" type="button" aria-label="Close" onClick={() => setHistoryOpen(false)}><X size={17} /></button><span className="modal-kicker">YOUR WORKSPACE</span><h2 id="history-title">Poster history</h2><div className="history-list">{history.length ? history.map((item) => <div className="history-item" key={item._id}><span className="history-icon"><FileImage size={16} /></span><span><strong>{item.formData.headline}</strong><small>{item.formData.name} · {new Date(item.createdAt).toLocaleDateString()}</small></span><button className="history-action" type="button" disabled={historyAction === item._id || !item.generatedImageUrl} onClick={() => item.generatedImageUrl && void downloadAsset(item.generatedImageUrl, "poster-maker.png")} aria-label={`Download ${item.formData.headline}`} title="Download"><ArrowDownToLine size={15} /></button><button className="history-action" type="button" disabled={historyAction === item._id || item.retryCount >= 2 || item.status !== "completed"} onClick={() => void regenerateHistory(item)} aria-label={`Regenerate ${item.formData.headline}`} title="Regenerate"><RefreshCw size={15} /></button><button className="history-action danger" type="button" disabled={historyAction === item._id} onClick={() => void deleteHistory(item)} aria-label={`Delete ${item.formData.headline}`} title="Delete"><Trash2 size={15} /></button></div>) : <p className="empty-history">No saved posters yet.</p>}</div></section></div>}
  </main>;
}
