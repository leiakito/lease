import { useState } from 'react'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function centsToYuan(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function formatDate(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}年${yyyymmdd.slice(4, 6)}月${yyyymmdd.slice(6, 8)}日`
}

// ---------------------------------------------------------------------------
// Mock data — in production fetched by paymentId from route params
// ---------------------------------------------------------------------------

type BillType = 'rent' | 'deposit'
type DemoScene = 'rent-paid' | 'deposit-partial' | 'no-receipt'

interface SceneData {
  payment: {
    id: string
    date: string
    amount: number
    method: string
    note: string
    orderLink: string | null
  }
  bill: {
    type: BillType
    periodLabel: string
    dueAmount: number
    paidAmount: number
  }
  contract: {
    tenantName: string
    propertyName: string
    propertyAddress: string
    hasAtLeastOnePayment: boolean
  }
}

const SCENES: Record<DemoScene, SceneData> = {
  'rent-paid': {
    payment: {
      id: 'R20241115001',
      date: '20241115',
      amount: 320000,
      method: '银行转账',
      note: '11月份房租，提前3天到账',
      orderLink: null,
    },
    bill: {
      type: 'rent',
      periodLabel: '第3期（2024.11.01–2024.11.30）',
      dueAmount: 320000,
      paidAmount: 320000,
    },
    contract: {
      tenantName: '王明远',
      propertyName: '望京花园·403室',
      propertyAddress: '北京市朝阳区望京花园2单元403室',
      hasAtLeastOnePayment: true,
    },
  },
  'deposit-partial': {
    payment: {
      id: 'R20240301002',
      date: '20240301',
      amount: 640000,
      method: '微信转账',
      note: '押金首次到账，仍差一个月',
      orderLink: 'wxp://f2f0wlcHQX8ABCDEF987654',
    },
    bill: {
      type: 'deposit',
      periodLabel: '',
      dueAmount: 960000,
      paidAmount: 640000,
    },
    contract: {
      tenantName: '李晓雯',
      propertyName: '幸福里·201室',
      propertyAddress: '上海市杨浦区幸福里公寓2栋201室',
      hasAtLeastOnePayment: true,
    },
  },
  'no-receipt': {
    payment: {
      id: '',
      date: '',
      amount: 0,
      method: '',
      note: '',
      orderLink: null,
    },
    bill: { type: 'rent', periodLabel: '', dueAmount: 0, paidAmount: 0 },
    contract: {
      tenantName: '',
      propertyName: '',
      propertyAddress: '',
      hasAtLeastOnePayment: false,
    },
  },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NavBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div
      className="flex items-center px-4 sticky top-0 z-10"
      style={{ backgroundColor: '#1677ff', height: 44 }}
    >
      <button onClick={onBack} className="mr-3 flex items-center justify-center" style={{ width: 32, height: 32 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 15l-5-5 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="text-white font-medium text-base">{title}</span>
    </div>
  )
}

function StatusTag({ label, color }: { label: string; color: 'green' | 'orange' | 'blue' | 'red' }) {
  const palette = {
    green:  { text: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
    orange: { text: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
    blue:   { text: '#0958d9', bg: '#e6f4ff', border: '#91caff' },
    red:    { text: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },
  }
  const { text, bg, border } = palette[color]
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ color: text, backgroundColor: bg, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: '#f0f0f0' }}
    >
      <span className="text-sm shrink-0 w-16" style={{ color: '#8c8c8c', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  )
}

function CopyButton({
  text,
  label = '复制',
  copiedLabel = '已复制',
}: {
  text: string
  label?: string
  copiedLabel?: string
}) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handle}
      className="text-xs px-2.5 py-1 rounded font-medium transition-colors shrink-0"
      style={
        copied
          ? { backgroundColor: '#f6ffed', color: '#52c41a', border: '1px solid #b7eb8f' }
          : { backgroundColor: '#e6f4ff', color: '#1677ff', border: '1px solid #91caff' }
      }
    >
      {copied ? copiedLabel : label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5f5' }}>
      <NavBar title="收据详情" onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center py-20">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mb-5">
          <rect width="72" height="72" rx="36" fill="#e6f4ff" />
          <rect x="22" y="18" width="28" height="36" rx="3" stroke="#91caff" strokeWidth="2" fill="none" />
          <path d="M29 28h14M29 34h14M29 40h8" stroke="#91caff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="50" r="10" fill="#fff7e6" stroke="#ffd591" strokeWidth="2" />
          <path d="M50 45v5.5M50 53v1" stroke="#fa8c16" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="text-base font-semibold mb-2" style={{ color: '#262626' }}>
          暂无收据
        </p>
        <p className="text-sm leading-relaxed" style={{ color: '#8c8c8c' }}>
          请先在「收租 → 收款记录」中确认收款，再点击「生成收据」进入本页。
        </p>
        <button
          onClick={onBack}
          className="mt-8 w-full py-3 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#1677ff', color: 'white' }}
        >
          返回收租页
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReceiptDetail() {
  const [scene, setScene] = useState<DemoScene>('rent-paid')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const data = SCENES[scene]

  if (scene === 'no-receipt') {
    return (
      <div>
        <EmptyState onBack={() => setScene('rent-paid')} />
        <DemoSwitcher scene={scene} setScene={setScene} />
      </div>
    )
  }

  const { payment, bill, contract } = data
  const outstanding = Math.max(0, bill.dueAmount - bill.paidAmount)
  const isFullyPaid = outstanding === 0

  const handleGenerateKey = () => {
    setGenerating(true)
    setTimeout(() => {
      // Prefix ZK1. + pseudo-random base62 token
      const token = Array.from({ length: 24 }, () =>
        'ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz2345678'.charAt(
          Math.floor(Math.random() * 49)
        )
      ).join('')
      setGeneratedKey(`ZK1.${token}`)
      setGenerating(false)
    }, 900)
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#f5f5f5', fontFamily: "var(--font-sans)" }}
    >
      <NavBar title="收据详情" onBack={() => {}} />

      <div className="flex-1 overflow-y-auto pb-8">

        {/* ── Receipt card ─────────────────────────────────────────────── */}
        <div className="mx-3 mt-3">
          <div className="bg-white rounded-2xl relative">

            {/* Card header */}
            <div className="px-4 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold" style={{ color: '#1a1a1a' }}>
                  收款收据
                </span>
                {isFullyPaid ? (
                  <StatusTag label="已收清" color="green" />
                ) : (
                  <StatusTag label="未收清" color="orange" />
                )}
              </div>
              <div
                className="mt-1 font-mono text-xs"
                style={{ color: '#bfbfbf', fontFamily: 'var(--font-mono)' }}
              >
                {payment.id}
              </div>
            </div>

            {/* Tear-line divider with semicircular cutouts */}
            <div
              className="relative"
              style={{ borderTop: '2px dashed #e8e8e8', margin: '0 0' }}
            >
              <div
                className="absolute rounded-full"
                style={{ width: 16, height: 16, backgroundColor: '#f5f5f5', top: -9, left: -8 }}
              />
              <div
                className="absolute rounded-full"
                style={{ width: 16, height: 16, backgroundColor: '#f5f5f5', top: -9, right: -8 }}
              />
            </div>

            {/* Amount (centrepiece) */}
            <div className="px-4 pt-5 pb-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {bill.type === 'rent' ? (
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#e6f4ff', color: '#1677ff' }}>
                    租金 · {bill.periodLabel}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#fff7e6', color: '#d46b08' }}>
                    押金
                  </span>
                )}
              </div>
              <div
                className="text-4xl font-bold tracking-tight mt-1"
                style={{ color: '#1677ff', fontFamily: 'var(--font-mono)' }}
              >
                {centsToYuan(payment.amount)}
              </div>
              {bill.type === 'deposit' && (
                <div className="text-xs mt-1.5" style={{ color: '#bfbfbf' }}>
                  押金不计入经营净收入
                </div>
              )}
            </div>

            {/* Info rows */}
            <div className="px-4 pb-4">
              <InfoRow label="收款日期">
                <span className="text-sm" style={{ color: '#1a1a1a' }}>{formatDate(payment.date)}</span>
              </InfoRow>
              <InfoRow label="租　　客">
                <span className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{contract.tenantName}</span>
              </InfoRow>
              <InfoRow label="房　　源">
                <span className="text-sm" style={{ color: '#1a1a1a' }}>{contract.propertyName}</span>
              </InfoRow>
              <InfoRow label="通讯地址">
                <span className="text-sm text-right leading-relaxed" style={{ color: '#595959' }}>
                  {contract.propertyAddress}
                </span>
              </InfoRow>
              <InfoRow label="收款方式">
                <span className="text-sm" style={{ color: '#1a1a1a' }}>{payment.method}</span>
              </InfoRow>
              {payment.note ? (
                <InfoRow label="备　　注">
                  <span className="text-sm text-right leading-relaxed" style={{ color: '#595959' }}>
                    {payment.note}
                  </span>
                </InfoRow>
              ) : null}
              {payment.orderLink ? (
                <InfoRow label="订单链接">
                  <div className="flex items-center gap-2 max-w-full">
                    <span
                      className="text-xs truncate"
                      style={{ color: '#1677ff', maxWidth: 140, fontFamily: 'var(--font-mono)' }}
                    >
                      {payment.orderLink}
                    </span>
                    <CopyButton text={payment.orderLink} />
                  </div>
                </InfoRow>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Bill summary card ─────────────────────────────────────────── */}
        <div className="mx-3 mt-3">
          <div className="bg-white rounded-2xl p-4">
            <div
              className="text-sm font-semibold mb-4"
              style={{ color: '#262626' }}
            >
              账单核对
            </div>
            <div className="grid grid-cols-3 gap-0">
              <div className="text-center pr-3" style={{ borderRight: '1px solid #f0f0f0' }}>
                <div className="text-xs mb-1.5" style={{ color: '#8c8c8c' }}>应收</div>
                <div
                  className="text-base font-semibold"
                  style={{ color: '#1a1a1a', fontFamily: 'var(--font-mono)' }}
                >
                  {centsToYuan(bill.dueAmount)}
                </div>
              </div>
              <div className="text-center px-3" style={{ borderRight: '1px solid #f0f0f0' }}>
                <div className="text-xs mb-1.5" style={{ color: '#8c8c8c' }}>已收</div>
                <div
                  className="text-base font-semibold"
                  style={{ color: '#52c41a', fontFamily: 'var(--font-mono)' }}
                >
                  {centsToYuan(bill.paidAmount)}
                </div>
              </div>
              <div className="text-center pl-3">
                <div className="text-xs mb-1.5" style={{ color: '#8c8c8c' }}>未收</div>
                <div
                  className="text-base font-semibold"
                  style={{
                    color: outstanding > 0 ? '#d46b08' : '#bfbfbf',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {centsToYuan(outstanding)}
                </div>
              </div>
            </div>
            {bill.type === 'deposit' && (
              <div
                className="mt-4 pt-3 text-xs leading-5"
                style={{ borderTop: '1px solid #f0f0f0', color: '#8c8c8c' }}
              >
                押金计入现金增减；验房扣款为房东留存，不是现金支出；尚可退还租客金额请在验房页查看。
              </div>
            )}
          </div>
        </div>

        {/* ── Login key card (only if contract has ≥ 1 payment) ──────── */}
        {contract.hasAtLeastOnePayment && (
          <div className="mx-3 mt-3">
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-semibold" style={{ color: '#262626' }}>
                  租客登录密钥
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#f6ffed', color: '#389e0d', border: '1px solid #b7eb8f' }}
                >
                  可发放
                </span>
              </div>
              <p className="text-xs leading-5 mb-4" style={{ color: '#8c8c8c' }}>
                该合同已有收款记录，可向租客发放一次性登录密钥。密钥 7 天内有效，只能使用一次；新密钥自动使同一合同的旧密钥失效。
              </p>

              {/* Generated key display */}
              {generatedKey ? (
                <>
                  <div
                    className="rounded-xl p-3 mb-3"
                    style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}
                  >
                    <div
                      className="text-xs font-medium mb-2 flex items-center gap-1"
                      style={{ color: '#389e0d' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="#52c41a" strokeWidth="1.5" />
                        <path d="M4.5 7l2 2 3-3" stroke="#52c41a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      已生成 · 7天内有效 · 仅限使用一次
                    </div>
                    {/* Selectable key text */}
                    <div
                      className="rounded-lg px-3 py-2 flex items-center gap-2"
                      style={{ backgroundColor: 'white', border: '1px dashed #b7eb8f' }}
                    >
                      <span
                        className="flex-1 text-xs break-all leading-5 select-text"
                        style={{ color: '#1a1a1a', fontFamily: 'var(--font-mono)', userSelect: 'text' }}
                      >
                        {generatedKey}
                      </span>
                      <CopyButton text={generatedKey} label="复制" copiedLabel="已复制" />
                    </div>
                    <p className="text-xs mt-2 leading-4" style={{ color: '#8c8c8c' }}>
                      长按可全选。请通过微信直接发给租客，勿经不安全渠道转发。
                    </p>
                  </div>

                  {/* Secondary: regenerate */}
                  <button
                    onClick={handleGenerateKey}
                    disabled={generating}
                    className="w-full py-3 rounded-xl text-sm font-medium border transition-opacity"
                    style={{
                      borderColor: '#1677ff',
                      color: '#1677ff',
                      backgroundColor: 'white',
                      opacity: generating ? 0.5 : 1,
                    }}
                  >
                    {generating ? '生成中…' : '重新生成密钥'}
                  </button>
                </>
              ) : (
                /* Primary: generate */
                <button
                  onClick={handleGenerateKey}
                  disabled={generating}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
                  style={{
                    backgroundColor: '#1677ff',
                    opacity: generating ? 0.6 : 1,
                  }}
                >
                  {generating ? '生成中…' : '生成登录密钥'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Close button ──────────────────────────────────────────────── */}
        <div className="mx-3 mt-4">
          <button
            className="w-full py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#f0f0f0', color: '#595959' }}
          >
            关闭
          </button>
        </div>

        <p className="text-center text-xs mt-4 px-8 leading-5" style={{ color: '#d9d9d9' }}>
          收据仅供核对，如需修改收款信息请返回收租页操作
        </p>

        {/* Demo switcher (remove in production) */}
        <DemoSwitcher scene={scene} setScene={(s) => { setScene(s); setGeneratedKey(null) }} />

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Demo scene switcher — remove in production
// ---------------------------------------------------------------------------

function DemoSwitcher({
  scene,
  setScene,
}: {
  scene: DemoScene
  setScene: (s: DemoScene) => void
}) {
  const options: { key: DemoScene; label: string }[] = [
    { key: 'rent-paid', label: '租金·已收清' },
    { key: 'deposit-partial', label: '押金·未收清' },
    { key: 'no-receipt', label: '空状态' },
  ]
  return (
    <div className="mx-3 mt-6 mb-2">
      <div
        className="rounded-2xl p-3"
        style={{ backgroundColor: 'white', border: '1px dashed #d9d9d9' }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: '#bfbfbf' }}>
          演示场景切换（生产环境移除）
        </p>
        <div className="flex gap-2 flex-wrap">
          {options.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setScene(key)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={
                scene === key
                  ? { backgroundColor: '#1677ff', color: 'white' }
                  : { backgroundColor: '#f5f5f5', color: '#595959' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
