"use client"

import { useState, useEffect } from "react"
import { getLottoHistory, clearLottoHistory, updateLottoResult, deleteLottoResult } from "@/utils/lotto-storage"
import type { LottoResult } from "@/types/lotto"
import { Button } from "@/components/ui/button"
import {
  Trash2,
  Calendar,
  Clock,
  Edit2,
  Check,
  X,
  MessageSquare,
  Sparkles,
  Filter,
  Search,
  XCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { format, isToday, isYesterday } from "date-fns"
import { ko } from "date-fns/locale"
import { getBallColor } from "@/utils/lotto-utils"
import { Textarea } from "@/components/ui/textarea"

export default function HistoryPage() {
  const [history, setHistory] = useState<LottoResult[]>([])
  const [filteredHistory, setFilteredHistory] = useState<LottoResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [memoText, setMemoText] = useState("")

  // Filter states
  const [showOnlyAiRecommended, setShowOnlyAiRecommended] = useState(false)
  const [filterNumbers, setFilterNumbers] = useState<number[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    // Load history from localStorage
    const loadHistory = () => {
      setIsLoading(true)
      const data = getLottoHistory()
      setHistory(data)
      setFilteredHistory(data)
      setIsLoading(false)
    }

    loadHistory()
  }, [])

  // Apply filters whenever filter conditions change
  useEffect(() => {
    applyFilters()
  }, [history, showOnlyAiRecommended, filterNumbers])

  const applyFilters = () => {
    let filtered = [...history]

    // Filter for AI recommended numbers
    if (showOnlyAiRecommended) {
      filtered = filtered.filter((item) => item.isAiRecommended)
    }

    // Filter for specific numbers
    if (filterNumbers.length > 0) {
      filtered = filtered.filter((item) => filterNumbers.every((num) => item.numbers.includes(num)))
    }

    setFilteredHistory(filtered)
  }

  const toggleFilterNumber = (num: number) => {
    if (filterNumbers.includes(num)) {
      setFilterNumbers(filterNumbers.filter((n) => n !== num))
    } else {
      setFilterNumbers([...filterNumbers, num])
    }
  }

  const clearFilters = () => {
    setShowOnlyAiRecommended(false)
    setFilterNumbers([])
  }

  const handleClearHistory = () => {
    if (window.confirm("모든 추첨 기록을 삭제하시겠습니까?")) {
      clearLottoHistory()
      setHistory([])
      setFilteredHistory([])
      toast({
        title: "기록 삭제 완료",
        description: "모든 추첨 기록이 삭제되었습니다.",
      })
    }
  }

  const startEditing = (id: string, currentMemo = "") => {
    setEditingId(id)
    setMemoText(currentMemo)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setMemoText("")
  }

  const saveMemo = (id: string) => {
    const success = updateLottoResult(id, { memo: memoText.trim() })

    if (success) {
      // Update local state to reflect the change
      const updatedHistory = history.map((item) => (item.id === id ? { ...item, memo: memoText.trim() } : item))
      setHistory(updatedHistory)

      toast({
        title: "메모 저장 완료",
        description: "메모가 성공적으로 저장되었습니다.",
      })
    } else {
      toast({
        title: "메모 저장 실패",
        description: "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }

    setEditingId(null)
  }

  const handleDeleteEntry = (id: string) => {
    if (window.confirm("이 추첨 기록을 삭제하시겠습니까?")) {
      const success = deleteLottoResult(id)

      if (success) {
        // Update local state to reflect the deletion
        const updatedHistory = history.filter((item) => item.id !== id)
        setHistory(updatedHistory)

        toast({
          title: "기록 삭제 완료",
          description: "선택한 추첨 기록이 삭제되었습니다.",
        })
      } else {
        toast({
          title: "기록 삭제 실패",
          description: "기록 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    }
  }

  // Group history items by date
  const groupedHistory = filteredHistory.reduce<Record<string, LottoResult[]>>((groups, item) => {
    const date = new Date(item.timestamp)
    let groupKey: string

    if (isToday(date)) {
      groupKey = "today"
    } else if (isYesterday(date)) {
      groupKey = "yesterday"
    } else {
      // Use the actual date as the group key for other dates
      groupKey = format(date, "yyyy년 MM월 dd일", { locale: ko })
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {})

  const getGroupTitle = (key: string): string => {
    if (key === "today") return "오늘"
    if (key === "yesterday") return "어제"
    return key // For other dates, the key itself is already the formatted date
  }

  const hasActiveFilters = showOnlyAiRecommended || filterNumbers.length > 0
  const noFilteredResults = filteredHistory.length === 0 && hasActiveFilters

  // Generate numbers 1-45 for the number selector
  const allNumbers = Array.from({ length: 45 }, (_, i) => i + 1)

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header with filter toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">추첨 기록</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`${isFilterOpen ? "bg-blue-50 text-blue-600 border-blue-200" : ""}`}
          >
            <Filter className="w-4 h-4 mr-1" />
            필터
            {hasActiveFilters && (
              <span className="ml-1 w-4 h-4 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                {(showOnlyAiRecommended ? 1 : 0) + (filterNumbers.length > 0 ? 1 : 0)}
              </span>
            )}
          </Button>

          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={handleClearHistory}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              기록 삭제
            </Button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {isFilterOpen && (
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">필터 옵션</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 h-8">
                <XCircle className="w-4 h-4 mr-1" />
                필터 초기화
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* AI 추천 필터 */}
            <div>
              <Button
                variant={showOnlyAiRecommended ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyAiRecommended(!showOnlyAiRecommended)}
                className={showOnlyAiRecommended ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                AI 추천 번호만 보기
              </Button>
            </div>

            {/* 특정 번호 포함 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">특정 번호 포함 결과만 보기</label>

              {/* 번호 선택 그리드 */}
              <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 sm:gap-3 place-items-center">
                {allNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => toggleFilterNumber(num)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      filterNumbers.includes(num)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">기록을 불러오는 중...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">추첨 기록이 없습니다</h2>
          <p className="text-gray-500 mb-6">로또 번호를 추첨하면 여기에 자동으로 기록됩니다.</p>
          <Link href="/">
            <Button className="bg-blue-500 hover:bg-blue-600 px-6">로또 추첨하러 가기</Button>
          </Link>
        </div>
      ) : noFilteredResults ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">검색 결과가 없습니다</h2>
          <p className="text-gray-500 mb-6">현재 필터 조건에 맞는 추첨 기록이 없습니다.</p>
          <Button onClick={clearFilters} className="bg-blue-500 hover:bg-blue-600 px-6">
            필터 초기화
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(
            ([group, items]) =>
              items.length > 0 && (
                <div key={group} className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-700 border-b pb-2">{getGroupTitle(group)}</h2>
                  <div className="space-y-4">
                    {items.map((result) => (
                      <HistoryCard
                        key={result.id}
                        result={result}
                        isEditing={editingId === result.id}
                        memoText={editingId === result.id ? memoText : result.memo || ""}
                        onEdit={() => startEditing(result.id, result.memo || "")}
                        onCancel={cancelEditing}
                        onSave={() => saveMemo(result.id)}
                        onMemoChange={(text) => setMemoText(text)}
                        onDelete={handleDeleteEntry}
                      />
                    ))}
                  </div>
                </div>
              ),
          )}
        </div>
      )}
    </div>
  )
}

interface HistoryCardProps {
  result: LottoResult
  isEditing: boolean
  memoText: string
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onMemoChange: (text: string) => void
  onDelete: (id: string) => void
}

function HistoryCard({
  result,
  isEditing,
  memoText,
  onEdit,
  onCancel,
  onSave,
  onMemoChange,
  onDelete,
}: HistoryCardProps) {
  const date = new Date(result.timestamp)
  const formattedDate = format(date, "yyyy년 MM월 dd일", { locale: ko })
  const formattedTime = format(date, "a h:mm", { locale: ko })

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <div className="flex items-center text-gray-500 text-sm mr-2">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formattedTime}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(result.id)}
              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 h-auto"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* AI 추천 번호 표시 */}
        {result.isAiRecommended && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Sparkles className="w-3 h-3 mr-1" />
              AI 추천 번호
            </span>
          </div>
        )}

        <div className="flex flex-nowrap overflow-x-auto py-2 justify-center gap-4">
          {result.numbers.map((number) => (
            <div
              key={number}
              className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex-shrink-0 flex items-center justify-center text-black font-bold text-xs sm:text-sm md:text-lg shadow-md"
              style={{ backgroundColor: getBallColor(number) }}
            >
              {number}
            </div>
          ))}
        </div>

        {/* Memo Section */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                placeholder="메모를 입력하세요..."
                value={memoText}
                onChange={(e) => onMemoChange(e.target.value)}
                className="w-full text-sm resize-none min-h-[80px]"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={onCancel} className="text-gray-500">
                  <X className="w-4 h-4 mr-1" />
                  취소
                </Button>
                <Button size="sm" onClick={onSave} className="bg-green-500 hover:bg-green-600">
                  <Check className="w-4 h-4 mr-1" />
                  저장
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {result.memo ? (
                <div className="flex justify-between items-start">
                  <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md flex-1">{result.memo}</div>
                  <Button variant="ghost" size="sm" onClick={onEdit} className="ml-2 text-gray-400 hover:text-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="text-gray-400 hover:text-gray-600 w-full justify-center"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  메모 추가하기
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
