export function About() {
  const teamMembers = [
    {
      name: "Jenel Esteron",
      role: "API/Database",
      avatar: "J",
      portfolio: "https://github.com/jenelesteron",
      linkedin: "https://linkedin.com/in/jenelesteron",
    },
    {
      name: "Amry Judith Gutlay",
      role: "Middleware/Frontend",
      avatar: "A",
      portfolio: "https://github.com/amrygutlay",
      linkedin: "https://linkedin.com/in/amrygutlay",
    },
    {
      name: "Michael Liam San Diego",
      role: "API/Frontend",
      avatar: "ML",
      portfolio: "https://github.com/michaelsandiego",
      linkedin: "https://linkedin.com/in/michaelsandiego",
    },
    {
      name: "Mark John Wayne Yabes",
      role: "API/Database",
      avatar: "MJ",
      portfolio: "https://github.com/markjohnyabes",
      linkedin: "https://linkedin.com/in/markjohnyabes",
    },
    {
      name: "Tristan Von Ceazar Yanoria",
      role: "Documentation/Frontend",
      avatar: "T",
      portfolio: "https://github.com/tristanyanoria",
      linkedin: "https://linkedin.com/in/tristanyanoria",
    },
    {
      name: "John Odysseus Lim",
      role: "Documentation/Middleware",
      avatar: "J",
      portfolio: "https://github.com/johlim",
      linkedin: "https://linkedin.com/in/johlim",
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-4xl font-bold text-center mb-4 font-medieval">About PeerQuest Tavern</h2>
      <p className="text-center max-w-3xl mx-auto mb-8 text-tavern-brown/80">
        Learn more about our platform and the team behind it.
      </p>

      <div className="card mb-8">
        <div className="p-10">
          <h3 className="text-3xl font-bold mb-6 font-medieval">Our Story</h3>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="mb-5 leading-relaxed">
                PeerQuest Tavern is a fantasy-themed peer learning platform where coding and collaboration become an
                epic adventure. Our mission is to transform the often solitary experience of learning to code into a
                collaborative and engaging journey.
              </p>
              <p className="mb-5 leading-relaxed">
                In the world of PeerQuest, you're not just a developer - you're an adventurer, taking on quests, earning
                experience, and joining guilds of like-minded peers. Whether you're a novice apprentice or a seasoned
                archmage of code, there's a place for you at our tavern.
              </p>
              <p className="leading-relaxed">
                What started as casual meetups to review each other's code soon evolved into a structured system of
                "quests" and "rewards" - and the fantasy theme made the process more engaging and fun.
              </p>
            </div>
            <div className="text-center">
              <div className="w-50 h-50 bg-tavern-bronze rounded-full flex items-center justify-center mx-auto text-8xl">
                🏰
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-10">
          <h3 className="text-3xl font-bold mb-8 font-medieval text-center">The Team</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center bg-white border border-[#CDAA7D] rounded-lg p-6">
                <div className="avatar avatar-xl mx-auto mb-4">{member.avatar}</div>
                <h4 className="text-xl font-bold mb-2 font-medieval">{member.name}</h4>
                <p className="text-tavern-brown/70 mb-4">{member.role}</p>
                <div className="flex justify-center gap-3">
                  <a
                    href={member.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#CDAA7D] text-[#2C1A1D] px-3 py-1 rounded text-sm font-medium hover:bg-[#B8941F] transition-colors"
                  >
                    Portfolio
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#8B75AA] text-white px-3 py-1 rounded text-sm font-medium hover:bg-[#7A6699] transition-colors"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
