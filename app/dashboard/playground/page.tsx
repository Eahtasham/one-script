export default function PlaygroundPage() {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Playground</h1>
                <p className="text-gray-400 mt-1">Test your chatbot before deploying</p>
            </div>

            <div className="grid grid-cols-2 gap-8 h-[calc(100vh-200px)]">
                {/* Chat Preview */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-800">
                        <h2 className="font-semibold text-white">Chat Preview</h2>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="text-center text-gray-500 mt-20">
                            <p>Start typing to test your chatbot</p>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-800">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors">
                                Send
                            </button>
                        </div>
                    </div>
                </div>

                {/* Context Panel */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-800">
                        <h2 className="font-semibold text-white">Context & Sources</h2>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="text-center text-gray-500 mt-20">
                            <p>Retrieved context will appear here</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
