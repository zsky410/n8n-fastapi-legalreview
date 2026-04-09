import { useState } from "react";

import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardContent } from "../../components/ui/Card.jsx";
import FileUpload from "../../components/ui/FileUpload.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Select from "../../components/ui/Select.jsx";
import { LEGAL_DOMAINS } from "../../lib/constants.js";

export default function CreateCase() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [domain, setDomain] = useState(LEGAL_DOMAINS[0]);
  const [files, setFiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-brand-50">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-brand-100 bg-brand-50 text-brand-700">Scaffold tạo hồ sơ</Badge>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Form và upload zone đã được dựng sẵn cho Phase 2.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Phase 1 chốt layout, field group và upload preview. Submit thật vào local/mock state sẽ được bật trong Phase 2.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input label="Tên vụ việc" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Gia hạn hợp đồng thuê văn phòng" />
              <Select
                label="Lĩnh vực"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                options={LEGAL_DOMAINS.map((item) => ({ label: item, value: item }))}
              />
            </div>
            <Input
              label="Mô tả ngắn"
              multiline
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Nêu rõ điều khoản, deadline, mức ưu tiên..."
            />
            <FileUpload files={files} onFilesChange={setFiles} />
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary">Lưu nháp</Button>
              <Button onClick={() => setIsModalOpen(true)}>Xem trước khi gửi</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-white">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Tóm tắt xem trước</p>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-sm text-white/70">Tên vụ việc</p>
              <p className="mt-2 text-lg font-semibold text-white">{title || "Chưa điền"}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-sm text-white/70">Lĩnh vực</p>
              <p className="mt-2 text-lg font-semibold text-white">{domain}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-sm text-white/70">Tệp đính kèm</p>
              <p className="mt-2 text-lg font-semibold text-white">{files.length} file xem trước</p>
            </div>
            <p className="text-sm leading-6 text-slate-300">
              Modal xem trước này cho phép xác nhận UI flow mà chưa cần commit vào local state quá sớm.
            </p>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Xem trước Phase 1"
        description="Workflow tạo hồ sơ đầy đủ sẽ được implement trong Phase 2."
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            Form scaffold đã sẵn sàng với tên vụ việc, mô tả, lĩnh vực và upload zone. Bước tiếp theo là tạo case vào local/mock state và điều hướng sang CaseDetail.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>Đóng</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
