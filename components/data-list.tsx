"use client"

export default function DataList({ data, onEdit }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No data entries yet. Create your first entry to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((entry) => (
        <div key={entry.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-slate-900">HH-{entry.householdId}</h3>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    entry.status === "submitted"
                      ? "bg-green-100 text-green-800"
                      : entry.status === "reviewed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {entry.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{entry.location}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-600">Family Size:</span>
                  <span className="font-medium ml-1">{entry.familySize}</span>
                </div>
                <div>
                  <span className="text-slate-600">Water:</span>
                  <span className="font-medium ml-1">{entry.waterSource.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="text-slate-600">Sanitation:</span>
                  <span className="font-medium ml-1">{entry.sanitationFacility.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="text-slate-600">Date:</span>
                  <span className="font-medium ml-1">{entry.date}</span>
                </div>
              </div>
              {entry.healthIssues.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.healthIssues.map((issue) => (
                    <span key={issue} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      {issue.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onEdit(entry.id)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
