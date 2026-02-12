"use client";

import { useRef, useState, useEffect, useMemo } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

const WEAPONS = [
  "わかばシューター",
  "もみじシューター",
  "スプラシューター",
  "スプラシューターコラボ",
  "スプラシューター煌",
  "N-ZAP85",
  "N-ZAP89",
  "プロモデラーMG",
  "プロモデラーRG",
  "プロモデラー彩",
  "ボールドマーカー",
  "ボールドマーカーネオ",
  "シャープマーカー",
  "シャープマーカーネオ",
  "シャープマーカーGECK",
  ".52ガロン",
  ".52ガロンデコ",
  ".96ガロン",
  ".96ガロンデコ",
  ".96ガロン爪",
  "L3リールガン",
  "L3リールガンD",
  "L3リールガン箔",
  "H3リールガン",
  "H3リールガンD",
  "H3リールガンSNAK",
  "プライムシューター",
  "プライムシューターコラボ",
  "プライムシューターFRZN",
  "ジェットスイーパー",
  "ジェットスイーパーカスタム",
  "ジェットスイーパーCOBR",
  "ボトルガイザー",
  "ボトルガイザーフォイル",
  "スペースシューター",
  "スペースシューターコラボ",
  "スプラローラー",
  "スプラローラーコラボ",
  "カーボンローラー",
  "カーボンローラーデコ",
  "カーボンローラーANGL",
  "ヴァリアブルローラー",
  "ヴァリアブルローラーフォイル",
  "ダイナモローラー",
  "ダイナモローラーテスラ",
  "ダイナモローラー冥",
  "ワイドローラー",
  "ワイドローラーコラボ",
  "ワイドローラー惑",
  "ドライブワイパー",
  "ドライブワイパーデコ",
  "ドライブワイパーRUST",
  "ジムワイパー",
  "ジムワイパー・ヒュー",
  "ジムワイパー封",
  "デンタルワイパーミント",
  "デンタルワイパースミ",
  "パブロ",
  "パブロ・ヒュー",
  "ホクサイ",
  "ホクサイ・ヒュー",
  "ホクサイ彗(スイ)",
  "フィンセント",
  "フィンセント・ヒュー",
  "フィンセントBRNZ",
  "ホットブラスター",
  "ホットブラスターカスタム",
  "ホットブラスター艶(エン)",
  "ロングブラスター",
  "ロングブラスターカスタム",
  "ノヴァブラスター",
  "ノヴァブラスターネオ",
  "クラッシュブラスター",
  "クラッシュブラスターネオ",
  "ラピッドブラスター",
  "ラピッドブラスターデコ",
  "Rブラスターエリート",
  "Rブラスターエリートデコ",
  "RブラスターエリートWNTR",
  "S-BLAST92",
  "S-BLAST91",
  "バケットスロッシャー",
  "バケットスロッシャーデコ",
  "ヒッセン",
  "ヒッセン・ヒュー",
  "ヒッセンASH",
  "スクリュースロッシャー",
  "スクリュースロッシャーネオ",
  "エクスプロッシャー",
  "エクスプロッシャーカスタム",
  "オーバーフロッシャー",
  "オーバーフロッシャーデコ",
  "モップリン",
  "モップリンD",
  "モップリン角(カク)",
  "スプラマニューバー",
  "スプラマニューバーコラボ",
  "スプラマニューバー耀",
  "スパッタリー",
  "スパッタリー・ヒュー",
  "スパッタリーOWL",
  "クアッドホッパーブラック",
  "クアッドホッパーホワイト",
  "ケルビン525",
  "ケルビン525デコ",
  "デュアルスイーパー",
  "デュアルスイーパーカスタム",
  "デュアルスイーパー蹄(テイ)",
  "ガエンFF",
  "パラシェルター",
  "パラシェルターソレーラ",
  "キャンピングシェルター",
  "キャンピングシェルターソレーラ",
  "キャンピングシェルターCREM",
  "スパイガジェット",
  "スパイガジェットソレーラ",
  "スパイガジェット繚(リョウ)",
  "24式張替傘・甲",
  "24式張替傘・乙",
  "トライストリンガー",
  "トライストリンガーコラボ",
  "トライストリンガー燈",
  "LACT-450",
  "LACT-450デコ",
  "LACT-450MILK",
  "フルイドV",
  "フルイドVカスタム",
  "スプラスピナー",
  "スプラスピナーコラボ",
  "スプラスピナーPYTN",
  "バレルスピナー",
  "バレルスピナーデコ",
  "クーゲルシュライバー",
  "クーゲルシュライバー・ヒュー",
  "ノーチラス47",
  "ノーチラス79",
  "イグザミナー",
  "イグザミナー・ヒュー",
  "ハイドラント",
  "ハイドラントカスタム",
  "ハイドラント圧",
  "スプラチャージャー",
  "スプラチャージャーコラボ",
  "スプラチャージャーFRST",
  "スプラスコープ",
  "スプラスコープコラボ",
  "スプラスコープFRST",
  "リッター4K",
  "リッター4Kカスタム",
  "4Kスコープ",
  "4Kスコープカスタム",
  "スクイックリンα",
  "スクイックリンβ",
  "ソイチューバー",
  "ソイチューバーカスタム",
  "14式竹筒銃・甲",
  "14式竹筒銃・乙",
  "R-PEN/5H",
  "R-PEN/5B",
];

export default function WeaponSelector({
  value,
  onChange,
  placeholder = "ブキを選択",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const lq = q.trim().toLowerCase();
    if (!lq) return WEAPONS;
    return WEAPONS.filter((s) => s.toLowerCase().includes(lq));
  }, [q]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }

    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between rounded-full border bg-white px-4 py-2 text-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${value ? "" : "text-muted-foreground"}`}>
          {value || placeholder}
        </span>
        <span className="ml-2 text-sm">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 w-full max-w-full rounded-xl border bg-white shadow-lg">
          <div className="p-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`検索: ${placeholder}`}
              className="w-full rounded-full border bg-white px-4 py-2 text-sm"
            />
          </div>

          <div className="max-h-72 overflow-y-auto border-t">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                  setQ("");
                }}
                className={`w-full text-left px-4 py-3 text-sm transition hover:bg-slate-50 ${
                  s === value ? "bg-slate-100 font-semibold" : ""
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
