import { UserCircle, ShieldUser  } from "lucide-react";

export default function AnnouncementPage() {
  const announcements = [
  {
    id: 1,
    author: "ADMIN",
    time: "12:12 pm",
    date: "May 20, 2025",
    subject: "Updated Duty Schedule",
    body: `Dear Guards,
    Please be informed of the following important updates:
    1. Duty Schedule Update
      The updated schedule for May 21–27, 2025 has been posted on the system. Contact the admin immediately for any scheduling concerns.

    Thank you for your cooperation and continued service.
    – Admin | JPM Security Agency`,
        image: "https://via.placeholder.com/200x120.png?text=Schedule",
      },
      {
        id: 2,
        author: "ADMIN",
        time: "9:30 am",
        date: "May 18, 2025",
        subject: "Uniform Policy Reminder",
        body: `Dear Guards,
    This is a reminder that all personnel must strictly adhere to the agency’s uniform policy. Please ensure that uniforms are complete, clean, and properly worn during duty hours.

    Your professionalism reflects our agency’s reputation.
    – Admin | JPM Security Agency`,
        image: "https://via.placeholder.com/200x120.png?text=Uniform",
      },
      {
        id: 3,
        author: "ADMIN",
        time: "3:45 pm",
        date: "May 15, 2025",
        subject: "Monthly Training Session",
        body: `Dear Guards,
    A mandatory training session will be held on May 25, 2025, at 9:00 am in the main training hall. The training will focus on emergency response and incident reporting.

    Attendance is required for all on-duty and off-duty guards.
    – Admin | JPM Security Agency`,
        image: "https://via.placeholder.com/200x120.png?text=Training",
      },
      {
        id: 4,
        author: "ADMIN",
        time: "8:00 am",
        date: "May 12, 2025",
        subject: "Salary Release Notice",
        body: `Dear Guards,
    Salaries for the period of April 21 – May 10, 2025, will be released on May 15, 2025. Please check your payroll accounts accordingly.

    For any concerns, coordinate with the finance office.
    – Admin | JPM Security Agency`,
        image: "https://via.placeholder.com/200x120.png?text=Salary",
      },
      {
        id: 5,
        author: "ADMIN",
        time: "5:10 pm",
        date: "May 10, 2025",
        subject: "Holiday Duty Roster",
        body: `Dear Guards,
    Please be advised that a special duty roster has been assigned for the upcoming holiday on May 13, 2025. Guards scheduled for duty must report on time and ensure proper turnover.

    Thank you for your cooperation.
    – Admin | JPM Security Agency`,
        image: "https://via.placeholder.com/200x120.png?text=Holiday",
      },
      {
        id: 6,
        author: "ADMIN",
        time: "11:25 am",
        date: "May 5, 2025",
        subject: "Equipment Check",
        body: `Dear Guards,
    All personnel are required to perform a full check of issued equipment, including radios, flashlights, and batons. Any defective items should be reported to logistics immediately.

    Let us ensure safety and readiness at all times.
    – Admin | JPM Security Agency`,
        image: "https://via.placeholder.com/200x120.png?text=Equipment",
      },
    ];


  return (
    <div className="h-screen flex flex-col bg-gray-100">
    {/* Page Header */}
    <header className="sticky top-0 bg-white shadow-md z-10">
      <h1 className="text-3xl font-extrabold text-center py-8 text-gray-900 tracking-wide">
        📢IMPORTANT ANNOUNCEMENTS
      </h1>
    </header>

    {/* Scrollable Announcements */}
    <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6 max-w-4xl mx-auto">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-xl p-6 shadow hover:shadow-lg transform hover:scale-105 transition duration-300"
          >
            {/* Header: Icon + Admin Info */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
                <ShieldUser size={28} className="text-gray-700" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{a.author}</h2>
                <p className="text-xs text-gray-500">
                  {a.time} • {a.date}
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <span className="font-semibold">To:</span> All Security Personnel
              </p>
              <p>
                <span className="font-semibold">Subject:</span>{" "}
                <span className="text-gray-900">{a.subject}</span>
              </p>
              <p className="leading-relaxed whitespace-pre-line">{a.body}</p>
            </div>

            {/* Image/Attachment */}
            {a.image && (
              <div className="mt-4">
                <img
                  src={a.image}
                  alt="Announcement Attachment"
                  className="rounded-lg border w-full max-w-md"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  </div>
  );
}
