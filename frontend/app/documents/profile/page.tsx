"use client";

import { Bot, FileText, Save, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { DocumentListItem, UserProfile, UserProfileUpdate, fetchDocuments, fetchUserProfile, updateUserProfile } from "@/lib/api";
import { humanStatus } from "@/lib/format";
import { PageError, RiskBadge } from "@/components/ui";

type ProfileFormState = Required<Record<keyof UserProfileUpdate, string>>;

const emptyForm: ProfileFormState = {
  full_name: "",
  age_range: "",
  occupation: "",
  organization: "",
  industry: "",
  jurisdiction: "",
  role_in_matters: "",
  legal_priority: "",
  risk_tolerance: "",
  preferred_language: "Tiếng Việt",
  preferred_tone: "Ngắn gọn, thực tế",
  contact_phone: "",
  notes: "",
};

const ageRanges = ["", "Dưới 25", "25-34", "35-44", "45-54", "55+", "Không muốn cung cấp"];
const riskTolerances = ["", "Thận trọng", "Cân bằng", "Chấp nhận rủi ro có kiểm soát", "Ưu tiên tốc độ xử lý"];
const legalPriorities = ["", "Giảm rủi ro pháp lý", "Đàm phán điều khoản tốt hơn", "Tiết kiệm thời gian rà soát", "Theo dõi nghĩa vụ và hạn chót", "Chuẩn bị hồ sơ tranh chấp"];

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const [profileData, documentsData] = await Promise.all([fetchUserProfile(), fetchDocuments("all")]);
      setProfile(profileData);
      setDocuments(documentsData.filter((document) => document.processing_status === "completed"));
      setForm(profileToForm(profileData));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải thông tin người dùng");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const completion = useMemo(() => {
    const importantFields: Array<keyof ProfileFormState> = ["age_range", "occupation", "role_in_matters", "legal_priority", "risk_tolerance", "jurisdiction"];
    const filled = importantFields.filter((key) => form[key].trim()).length;
    return Math.round((filled / importantFields.length) * 100);
  }, [form]);

  function updateField(key: keyof ProfileFormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setSavedMessage(null);
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim() || null]),
      ) as UserProfileUpdate;
      const updated = await updateUserProfile(payload);
      setProfile(updated);
      setForm(profileToForm(updated));
      setSavedMessage("Đã lưu thông tin. Các câu trả lời sau sẽ ưu tiên nhu cầu và cách diễn giải bạn chọn.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu thông tin người dùng");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page-stack client-command-center">
      <header className="client-hero profile-hero">
        <div>
          <p className="eyebrow">Hồ sơ tư vấn</p>
          <h1>Thông tin của bạn</h1>
          <p>Một vài thông tin cơ bản giúp phần trả lời gần hơn với nhu cầu, vai trò và mức ưu tiên của bạn.</p>
        </div>
        <div className="profile-score-card">
          <span>Mức hoàn thiện</span>
          <strong>{completion}%</strong>
          <small>{profile?.updated_at ? "Có thể cập nhật bất cứ lúc nào" : "Chưa lưu"}</small>
        </div>
      </header>

      {error ? <PageError message={error} onRetry={loadProfile} /> : null}
      {savedMessage ? <div className="notice-panel"><ShieldCheck size={18} aria-hidden="true" /><span>{savedMessage}</span></div> : null}

      <section className="profile-layout-grid">
        <form className="data-panel profile-form-panel" onSubmit={handleSubmit}>
          <div className="client-panel-heading">
            <span className="client-panel-icon"><UserRound size={17} aria-hidden="true" /></span>
            <div>
              <span>Thông tin cá nhân hóa</span>
              <h2>Giúp trợ lý hiểu nhu cầu của bạn</h2>
              <p>Chỉ cần điền những mục bạn thấy thoải mái chia sẻ. Nhóm tuổi, vai trò và ưu tiên thường đã đủ hữu ích.</p>
            </div>
          </div>

          {isLoading ? <div className="empty-state">Đang tải thông tin</div> : (
            <>
              <div className="profile-form-grid">
                <label>Họ tên / tên đại diện<input value={form.full_name} onChange={updateField("full_name")} placeholder="Nguyễn Văn A" /></label>
                <label>Nhóm tuổi<select value={form.age_range} onChange={updateField("age_range")}>{ageRanges.map((item) => <option key={item} value={item}>{item || "Chọn nhóm tuổi"}</option>)}</select></label>
                <label>Nghề nghiệp<input value={form.occupation} onChange={updateField("occupation")} placeholder="Chủ doanh nghiệp, HR, kế toán, luật sư..." /></label>
                <label>Công ty / tổ chức<input value={form.organization} onChange={updateField("organization")} placeholder="Tên công ty hoặc nhóm làm việc" /></label>
                <label>Lĩnh vực hoạt động<input value={form.industry} onChange={updateField("industry")} placeholder="Bất động sản, thương mại, lao động..." /></label>
                <label>Khu vực pháp lý thường gặp<input value={form.jurisdiction} onChange={updateField("jurisdiction")} placeholder="Việt Nam, TP.HCM, Đồng Nai..." /></label>
                <label>Vai trò trong hồ sơ/vụ việc<input value={form.role_in_matters} onChange={updateField("role_in_matters")} placeholder="Bên mua, bên bán, người lao động, chủ nợ..." /></label>
                <label>Ưu tiên pháp lý<select value={form.legal_priority} onChange={updateField("legal_priority")}>{legalPriorities.map((item) => <option key={item} value={item}>{item || "Chọn ưu tiên"}</option>)}</select></label>
                <label>Mức chấp nhận rủi ro<select value={form.risk_tolerance} onChange={updateField("risk_tolerance")}>{riskTolerances.map((item) => <option key={item} value={item}>{item || "Chọn mức rủi ro"}</option>)}</select></label>
                <label>Ngôn ngữ ưu tiên<input value={form.preferred_language} onChange={updateField("preferred_language")} /></label>
                <label>Cách tư vấn mong muốn<input value={form.preferred_tone} onChange={updateField("preferred_tone")} placeholder="Ngắn gọn, thực tế, giải thích dễ hiểu..." /></label>
                <label>Số điện thoại liên hệ<input value={form.contact_phone} onChange={updateField("contact_phone")} placeholder="Không bắt buộc" /></label>
              </div>
              <label>Điều bạn muốn trợ lý lưu ý<textarea value={form.notes} onChange={updateField("notes")} placeholder="Ví dụ: Tôi ưu tiên phương án ít tranh chấp, cần lời khuyên dễ hiểu cho người không chuyên luật..." maxLength={4000} /></label>
              <div className="profile-save-row">
                <span>Bạn có thể bỏ qua các mục không muốn chia sẻ và cập nhật lại khi nhu cầu thay đổi.</span>
                <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Đang lưu" : <><Save size={16} aria-hidden="true" /><span>Lưu thông tin</span></>}</button>
              </div>
            </>
          )}
        </form>

        <aside className="data-panel profile-context-panel">
          <div className="client-panel-heading">
            <span className="client-panel-icon"><Sparkles size={17} aria-hidden="true" /></span>
            <div>
              <span>Vì sao nên điền?</span>
              <h2>Câu trả lời sát nhu cầu hơn</h2>
              <p>Thông tin này giúp trợ lý cân bằng giữa an toàn pháp lý, tốc độ xử lý và cách diễn giải phù hợp.</p>
            </div>
          </div>
          <div className="context-use-list">
            <article><strong>Nghề nghiệp</strong><span>Chủ doanh nghiệp thường cần hướng xử lý nhanh; HR cần lưu ý lao động; cá nhân cần giải thích dễ hiểu hơn.</span></article>
            <article><strong>Vai trò trong hồ sơ</strong><span>Bên mua, bên bán, người lao động hay chủ nợ sẽ có mối quan tâm và rủi ro khác nhau.</span></article>
            <article><strong>Ưu tiên pháp lý</strong><span>Bạn có thể ưu tiên giảm rủi ro, thương lượng điều khoản, tiết kiệm thời gian hoặc chuẩn bị tranh chấp.</span></article>
            <article><strong>Khu vực pháp lý</strong><span>Khi cần, trợ lý sẽ nhắc bạn kiểm tra quy định, biểu mẫu hoặc thực tế áp dụng tại địa phương phù hợp.</span></article>
          </div>
        </aside>
      </section>

      <section className="data-panel client-panel profile-assistant-panel">
        <div className="client-panel-heading">
          <span className="client-panel-icon"><Bot size={17} aria-hidden="true" /></span>
          <div>
            <span>Hỏi theo tài liệu</span>
            <h2>Mở tài liệu để đặt câu hỏi</h2>
            <p>Chọn một tài liệu đã rà soát xong, sau đó dùng mục Hỏi trợ lý trong trang chi tiết.</p>
          </div>
        </div>
        {isLoading ? <div className="empty-state">Đang tải tài liệu</div> : documents.length ? (
          <div className="assistant-doc-grid">
            {documents.map((document) => (
              <Link className="assistant-doc-card" href={`/documents/${document.id}`} key={document.id} prefetch={false}>
                <FileText size={20} aria-hidden="true" />
                <strong>{document.filename}</strong>
                <span>{document.classification ? humanStatus(document.classification) : "Chưa phân loại"}</span>
                <RiskBadge score={document.risk_score} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state rich">
            <FileText size={28} aria-hidden="true" />
            <div>
              <strong>Chưa có tài liệu sẵn sàng</strong>
              <p>Tải tài liệu lên và chờ rà soát xong để bắt đầu đặt câu hỏi.</p>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

function profileToForm(profile: UserProfile): ProfileFormState {
  return {
    full_name: profile.full_name ?? "",
    age_range: profile.age_range ?? "",
    occupation: profile.occupation ?? "",
    organization: profile.organization ?? "",
    industry: profile.industry ?? "",
    jurisdiction: profile.jurisdiction ?? "",
    role_in_matters: profile.role_in_matters ?? "",
    legal_priority: profile.legal_priority ?? "",
    risk_tolerance: profile.risk_tolerance ?? "",
    preferred_language: profile.preferred_language ?? "Tiếng Việt",
    preferred_tone: profile.preferred_tone ?? "Ngắn gọn, thực tế",
    contact_phone: profile.contact_phone ?? "",
    notes: profile.notes ?? "",
  };
}
