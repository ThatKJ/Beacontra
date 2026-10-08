import CoreGraphics
import Foundation

let ownerQuery = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : ""

if let list = CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID) as? [[String: Any]] {
    for w in list {
        let owner = w[kCGWindowOwnerName as String] as? String ?? ""
        let name = w[kCGWindowName as String] as? String ?? ""
        let wid = w[kCGWindowNumber as String] as? Int ?? 0
        let bounds = w[kCGWindowBounds as String] as? [String: Any] ?? [:]
        
        if ownerQuery.isEmpty || owner.localizedCaseInsensitiveContains(ownerQuery) || name.localizedCaseInsensitiveContains(ownerQuery) {
            let x = bounds["X"] as? Double ?? 0
            let y = bounds["Y"] as? Double ?? 0
            let width = bounds["Width"] as? Double ?? 0
            let height = bounds["Height"] as? Double ?? 0
            print("{\"owner\": \"\(owner)\", \"name\": \"\(name)\", \"wid\": \(wid), \"x\": \(Int(x)), \"y\": \(Int(y)), \"width\": \(Int(width)), \"height\": \(Int(height))}")
        }
    }
}
