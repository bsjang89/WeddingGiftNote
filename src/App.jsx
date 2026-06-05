import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'wedding-gift-note:simple:v2'
const LEGACY_STORAGE_KEY = 'wedding-gift-note:simple:v1'

const amountOptions = [
  ['1만원', 10000],
  ['5만원', 50000],
  ['10만원', 100000],
  ['30만원', 300000],
]

const ticketOptions = [1, 2, 3]

function createEmptyForm(number = '1') {
  return {
    number,
    name: '',
    amount: 0,
    tickets: 0,
    memo: '',
  }
}

function normalizeNumbers(records) {
  return records.map((record, index, list) => ({
    ...record,
    number: String(list.length - index),
  }))
}

function formatWon(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

function loadGifts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!saved) return []

    const parsed = JSON.parse(saved).map((gift) => ({
      id: gift.id || crypto.randomUUID(),
      number: gift.number || '',
      name: gift.name || '',
      amount: gift.amount || 0,
      tickets: gift.tickets || 0,
      memo: gift.memo || '',
    }))

    return normalizeNumbers(parsed)
  } catch {
    return []
  }
}

function App() {
  const [gifts, setGifts] = useState(loadGifts)
  const [form, setForm] = useState(() => createEmptyForm())
  const [activeTab, setActiveTab] = useState('home')
  const [summaryEditGift, setSummaryEditGift] = useState(null)
  const nameInputRef = useRef(null)

  const totalAmount = gifts.reduce((sum, gift) => sum + gift.amount, 0)
  const totalTickets = gifts.reduce((sum, gift) => sum + gift.tickets, 0)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gifts))
  }, [gifts])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const addAmount = (value) => {
    setForm((current) => ({ ...current, amount: current.amount + value }))
  }

  const addTickets = (value) => {
    setForm((current) => ({ ...current, tickets: current.tickets + value }))
  }

  const resetForm = (nextNumber = String(gifts.length + 1)) => {
    setForm(createEmptyForm(nextNumber))
  }

  const saveGift = (id, payload) => {
    setGifts((current) =>
      normalizeNumbers(current.map((gift) => (gift.id === id ? { ...gift, ...payload } : gift))),
    )
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      alert('이름을 입력해주세요.')
      nameInputRef.current?.focus()
      return
    }

    if (!form.amount) {
      alert('금액을 선택해주세요.')
      return
    }

    const payload = {
      name: form.name.trim(),
      amount: form.amount,
      tickets: form.tickets,
      memo: form.memo.trim(),
    }

    setGifts((current) => normalizeNumbers([{ ...payload, id: crypto.randomUUID() }, ...current]))
    resetForm(String(gifts.length + 2))
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  const startHomeEdit = (gift) => {
    setSummaryEditGift(gift)
  }

  const deleteGift = (id) => {
    if (!confirm('삭제할까요?')) return

    const nextLength = gifts.length - 1
    setGifts((current) => normalizeNumbers(current.filter((gift) => gift.id !== id)))

    setForm((current) => ({ ...current, number: String(Math.max(nextLength, 0) + 1) }))
  }

  const deleteAllGifts = () => {
    if (!confirm('전체 데이터를 삭제할까요?')) return

    setGifts([])
    setForm((current) => ({ ...current, number: '1' }))
    setSummaryEditGift(null)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4e6_0,#f8fafc_34%,#eef6ff_100%)] px-4 pb-24 pt-5 text-slate-950">
      <section className={`mx-auto ${activeTab === 'summary' ? 'max-w-5xl' : 'max-w-[460px]'}`}>
        <header className="mb-5 text-center">
          <h1 className="text-3xl font-extrabold tracking-normal">축의금 장부</h1>
          <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-rose-400 to-blue-500" />
        </header>

        {activeTab === 'home' ? (
          <>
            <HomeForm
              form={form}
              nameInputRef={nameInputRef}
              updateForm={updateForm}
              addAmount={addAmount}
              addTickets={addTickets}
              onSubmit={handleSubmit}
            />
            <RecentList gifts={gifts} onEdit={startHomeEdit} onDelete={deleteGift} />
          </>
        ) : (
          <SummaryTab
            gifts={gifts}
            totalAmount={totalAmount}
            totalTickets={totalTickets}
            onEdit={setSummaryEditGift}
            onDelete={deleteGift}
            onDeleteAll={deleteAllGifts}
          />
        )}
      </section>

      {summaryEditGift && (
        <SummaryEditModal
          gift={summaryEditGift}
          onClose={() => setSummaryEditGift(null)}
          onSave={(payload) => {
            saveGift(summaryEditGift.id, payload)
            setSummaryEditGift(null)
          }}
        />
      )}

      <nav className="fixed inset-x-0 bottom-0 border-t border-white/70 bg-white/85 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto grid max-w-[460px] grid-cols-2 rounded-full bg-slate-100 p-1">
          <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')}>
            홈
          </TabButton>
          <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
            정산
          </TabButton>
        </div>
      </nav>
    </main>
  )
}

function HomeForm({ form, nameInputRef, updateForm, addAmount, addTickets, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-[18px] bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)] ring-1 ring-white/80 backdrop-blur"
    >
      <div className="grid grid-cols-[104px_1fr] items-end gap-3">
        <div>
          <span className="mb-1.5 block text-sm font-extrabold text-slate-500">번호</span>
          <div className="flex h-[46px] items-center justify-center rounded-xl bg-slate-950 text-2xl font-extrabold text-white shadow-sm">
            {form.number}
          </div>
        </div>

        <label>
          <span className="mb-1.5 block text-sm font-extrabold text-slate-500">이름</span>
          <input
            ref={nameInputRef}
            value={form.name}
            onChange={(event) => updateForm('name', event.target.value)}
            className="compact-input"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-extrabold text-slate-500">메모</span>
        <input
          value={form.memo}
          onChange={(event) => updateForm('memo', event.target.value)}
          className="compact-input"
        />
      </label>

      <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-3 ring-1 ring-slate-100">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex-1 text-xl font-extrabold">현재 금액: {formatWon(form.amount)}</span>
          <button
            type="button"
            onClick={() => updateForm('amount', 0)}
            className="rounded-full bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100"
          >
            금액 초기화
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {amountOptions.map(([label, value]) => (
            <button
              key={label}
              type="button"
              onClick={() => addAmount(value)}
              className="h-[50px] rounded-xl bg-white text-xl font-extrabold shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-white p-3 ring-1 ring-blue-100">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex-1 text-xl font-extrabold">식권: {form.tickets}장</span>
          <button
            type="button"
            onClick={() => updateForm('tickets', 0)}
            className="rounded-full bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100"
          >
            식권 초기화
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {ticketOptions.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => addTickets(value)}
              className="h-[50px] rounded-xl bg-blue-100 text-2xl font-extrabold text-blue-800 shadow-sm ring-1 ring-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-200 hover:shadow-md"
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="h-[55px] w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-3xl font-extrabold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30"
      >
        등록
      </button>
    </form>
  )
}

function RecentList({ gifts, onEdit, onDelete }) {
  const recentGifts = gifts.slice(0, 7)

  return (
    <section className="mt-6">
      <div className="mb-3">
        <h2 className="text-xl font-extrabold">최근 등록</h2>
      </div>

      {recentGifts.length ? (
        <ul className="space-y-2">
          {recentGifts.map((gift) => (
            <li
              key={gift.id}
              className="grid grid-cols-[34px_1fr_auto] items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-white/80 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-500">
                {gift.number}
              </span>
              <button type="button" onClick={() => onEdit(gift)} className="min-w-0 text-left">
                <span className="block truncate text-lg font-extrabold">{gift.name}</span>
                <span className="block text-sm font-bold text-neutral-500">
                  {formatWon(gift.amount)} / 식권 {gift.tickets}장
                </span>
                {gift.memo && (
                  <span className="block truncate text-sm font-bold text-neutral-500">
                    {gift.memo}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onDelete(gift.id)}
                className="rounded-full bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100"
                aria-label={`${gift.name} 삭제`}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md bg-white px-4 py-5 text-center font-bold text-neutral-500 shadow-sm">
          아직 등록된 내역이 없습니다.
        </p>
      )}
    </section>
  )
}

function SummaryTab({ gifts, totalAmount, totalTickets, onEdit, onDelete, onDeleteAll }) {
  const reportRef = useRef(null)

  const exportXlsx = async () => {
    const XLSX = await import('xlsx')
    const rows = [
      ['총 금액', totalAmount],
      ['총 인원', gifts.length],
      ['총 식권 수', totalTickets],
      [],
      ['번호', '이름', '금액', '식권', '메모'],
      ...gifts.map((gift) => [gift.number, gift.name, gift.amount, gift.tickets, gift.memo || '']),
    ]

    const sheet = XLSX.utils.aoa_to_sheet(rows)
    sheet['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 24 }]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, '정산')
    XLSX.writeFile(workbook, '축의금장부_정산.xlsx')
  }

  const exportPdf = async () => {
    if (!reportRef.current) return

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])
    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    })
    const imageData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const imageWidth = pageWidth - margin * 2
    const imageHeight = (canvas.height * imageWidth) / canvas.width
    const contentHeight = pageHeight - margin * 2

    let heightLeft = imageHeight
    let position = margin

    pdf.addImage(imageData, 'PNG', margin, position, imageWidth, imageHeight)
    heightLeft -= contentHeight

    while (heightLeft > 0) {
      position -= contentHeight
      pdf.addPage()
      pdf.addImage(imageData, 'PNG', margin, position, imageWidth, imageHeight)
      heightLeft -= contentHeight
    }

    pdf.save('축의금장부_정산.pdf')
  }

  return (
    <section>
      <h2 className="mb-4 text-center text-2xl font-extrabold">요약 정보</h2>

      <div className="mb-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={exportXlsx}
          className="rounded-full bg-blue-600 px-5 py-3 text-base font-extrabold text-white shadow-sm shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
        >
          엑셀 다운로드
        </button>
        <button
          type="button"
          onClick={exportPdf}
          className="rounded-full bg-slate-950 px-5 py-3 text-base font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
        >
          PDF 다운로드
        </button>
        <button
          type="button"
          onClick={onDeleteAll}
          className="rounded-full bg-rose-50 px-5 py-3 text-base font-extrabold text-rose-600 ring-1 ring-rose-200 transition hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-md"
        >
          전체 삭제
        </button>
      </div>

      <div className="mb-5 grid gap-3 text-xl font-bold sm:grid-cols-3">
        <p className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-white/80">총 금액<br />{formatWon(totalAmount)}</p>
        <p className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-white/80">총 인원<br />{gifts.length}명</p>
        <p className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-white/80">총 식권 수<br />{totalTickets}장</p>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/80">
        <table className="w-full min-w-[760px] border-collapse text-center">
          <thead>
            <tr className="bg-slate-100">
              <th className="summary-cell">번호</th>
              <th className="summary-cell">이름</th>
              <th className="summary-cell">금액</th>
              <th className="summary-cell">식권</th>
              <th className="summary-cell">메모</th>
              <th className="summary-cell">관리</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map((gift) => (
              <tr key={gift.id}>
                <td className="summary-cell">{gift.number}</td>
                <td className="summary-cell">{gift.name}</td>
                <td className="summary-cell">{gift.amount.toLocaleString('ko-KR')}</td>
                <td className="summary-cell">{gift.tickets}</td>
                <td className="summary-cell">{gift.memo || '-'}</td>
                <td className="summary-cell">
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(gift)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold transition hover:border-blue-300 hover:text-blue-700"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(gift.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="fixed left-[-9999px] top-0 w-[1100px] bg-white p-8 text-black" ref={reportRef}>
        <h2 className="mb-6 text-center text-3xl font-extrabold">축의금장부 정산</h2>
        <div className="mb-6 space-y-2 text-xl font-bold">
          <p>총 금액: {formatWon(totalAmount)}</p>
          <p>총 인원: {gifts.length}명</p>
          <p>총 식권 수: {totalTickets}장</p>
        </div>
        <table className="w-full border-collapse text-center text-lg">
          <thead>
            <tr className="bg-[#eeeeee]">
              <th className="border border-neutral-300 px-4 py-3">번호</th>
              <th className="border border-neutral-300 px-4 py-3">이름</th>
              <th className="border border-neutral-300 px-4 py-3">금액</th>
              <th className="border border-neutral-300 px-4 py-3">식권</th>
              <th className="border border-neutral-300 px-4 py-3">메모</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map((gift) => (
              <tr key={gift.id}>
                <td className="border border-neutral-300 px-4 py-3">{gift.number}</td>
                <td className="border border-neutral-300 px-4 py-3">{gift.name}</td>
                <td className="border border-neutral-300 px-4 py-3">
                  {gift.amount.toLocaleString('ko-KR')}
                </td>
                <td className="border border-neutral-300 px-4 py-3">{gift.tickets}</td>
                <td className="border border-neutral-300 px-4 py-3">{gift.memo || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SummaryEditModal({ gift, onClose, onSave }) {
  const [modalForm, setModalForm] = useState({
    name: gift.name,
    amount: String(gift.amount),
    tickets: String(gift.tickets),
    memo: gift.memo,
  })

  const updateModalForm = (field, value) => {
    setModalForm((current) => ({ ...current, [field]: value }))
  }

  const handleSave = (event) => {
    event.preventDefault()
    if (!modalForm.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    const amount = Number(String(modalForm.amount).replaceAll(',', '')) || 0
    if (!amount && !confirm('금액이 없습니다. 그대로 수정할까요?')) {
      return
    }

    onSave({
      name: modalForm.name.trim(),
      amount,
      tickets: Number(modalForm.tickets) || 0,
      memo: modalForm.memo.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
      <form onSubmit={handleSave} className="w-full max-w-[420px] rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">내역 수정</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-extrabold"
          >
            닫기
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-extrabold">번호</span>
            <input value={gift.number} readOnly className="compact-input bg-neutral-100 text-neutral-600" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-extrabold">이름</span>
            <input
              value={modalForm.name}
              onChange={(event) => updateModalForm('name', event.target.value)}
              className="compact-input"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-extrabold">금액</span>
            <input
              value={modalForm.amount}
              onChange={(event) => updateModalForm('amount', event.target.value)}
              className="compact-input"
              inputMode="numeric"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-extrabold">식권</span>
            <input
              value={modalForm.tickets}
              onChange={(event) => updateModalForm('tickets', event.target.value)}
              className="compact-input"
              inputMode="numeric"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-extrabold">메모</span>
            <input
              value={modalForm.memo}
              onChange={(event) => updateModalForm('memo', event.target.value)}
              className="compact-input"
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-5 h-12 w-full rounded-md bg-blue-500 text-xl font-extrabold text-white transition hover:bg-blue-600"
        >
          저장
        </button>
      </form>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-full text-xl font-extrabold transition ${
        active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

export default App
