import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface NotesCardProps {
    notes: string
    onNotesChange: (notes: string) => void
    onSave: () => Promise<void>
    isUpdating: boolean
}

export function NotesCard({
    notes,
    onNotesChange,
    onSave,
    isUpdating
}: NotesCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder="Add notes about this application..."
                    className="min-h-[150px] mb-2"
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                />
                <Button
                    size="sm"
                    className="w-full"
                    onClick={onSave}
                    disabled={isUpdating}
                >
                    Save Notes
                </Button>
            </CardContent>
        </Card>
    )
}
