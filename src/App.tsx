import { useState } from 'react'
import axios from 'axios'
import './App.css'
import Lantern from './components/Lantern'
import FuCharacter from './components/FuCharacter'
import OpenAI from 'openai'

function App() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [couplet, setCouplet] = useState({
    horizontal: '福满人间',
    upper: '福气带喜满门开',
    lower: '春风送暖入家来'
  })

  const openai = new OpenAI({
    baseURL: import.meta.env.VITE_OPENAI_API_URL,
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const generateCouplet = async () => {
    if (!input.trim()) {
      setError('温馨提示：请输入您想要的春联主题或关键词，比如"福"、"春"、"家"等')
      return
    }

    setLoading(true)
    setError('')

    try {
//       const response = await axios.post('/api/v1/messages', {
//         model: 'claude-3-sonnet-20240229',
//         max_tokens: 1024,
//         messages: [{
//           role: 'user',
//           content: `按如下格式生成一副对联（只返回对联内容，不要其他任何解释）：

// 横批：鸿运昌隆
// 上联：春风送暖入门来
// 下联：福气带喜满庭香

// 请用这个固定格式，生成一副与"${input}"相关的新春对联。注意：不要加句号或其他标点符号。`
//         }]
//       }, {
//         headers: {
//           'Content-Type': 'application/json',
//           'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
//           'anthropic-version': '2023-06-01',
//           'anthropic-dangerous-direct-browser-access': 'true'
//         },
//         timeout: 15000 // 增加超时时间到15秒
//       })

      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "你是一个中英文语言高手，擅长写各种对联" },
          {
            role: 'user',
            content: `按如下格式生成一副对联（只返回对联内容，不要其他任何解释）：

  横批：鸿运昌隆
  上联：春风送暖入门来
  下联：福气带喜满庭香

  请用这个固定格式，生成一副与"${input}"相关的新春对联。注意：不要加句号或其他标点符号。`
          }
        ],
        model: "deepseek-chat",
      });


      const content = completion.choices[0].message.content
      console.log('Claude返回内容:', content)
      if (content === null) {
        throw new Error('春联内容格式不正确')
      }
      
      // 使用正则表达式提取春联内容
      const horizontalMatch = content.match(/横批：([^\n]+)/)
      const upperMatch = content.match(/上联：([^\n]+)/)
      const lowerMatch = content.match(/下联：([^\n]+)/)
      
      if (!horizontalMatch || !upperMatch || !lowerMatch) {
        throw new Error('春联内容格式不正确')
      }
      
      const newCouplet = {
        horizontal: horizontalMatch[1].trim(),
        upper: upperMatch[1].trim(),
        lower: lowerMatch[1].trim()
      }
      
      console.log('提取的春联内容:', newCouplet)

      setCouplet(newCouplet)
    } catch (err) {
      console.error('Error generating couplet:', err)
      if (axios.isAxiosError(err)) {
        // 详细记录错误信息
        console.error('API Error Details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers,
          config: err.config
        })

        if (err.code === 'ECONNABORTED') {
          setError('请求超时，请检查网络连接后重试')
        } else if (err.response) {
          switch (err.response.status) {
            case 401:
              setError('API密钥无效，请联系管理员')
              break
            case 429:
              setError('请求过于频繁，请稍后再试')
              break
            case 500:
              setError('AI服务暂时不可用，请稍后重试')
              break
            default:
              const errorMessage = err.response.data?.error?.message || 
                                 err.response.data?.message || 
                                 err.response.statusText || 
                                 '未知错误'
              setError(`生成春联失败：${errorMessage}`)
              console.error('Detailed error response:', err.response.data)
          }
        } else if (err.request) {
          console.error('No response received:', err.request)
          setError('网络连接失败，请检查网络设置后重试')
        } else {
          console.error('Error details:', err.message)
          setError('生成春联失败，请稍后重试')
        }
      } else {
        console.error('Non-Axios error:', err)
        setError('生成春联时发生未知错误，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <h1 className="text-4xl font-bold text-center mb-10">AI 春联</h1>
      
      <div className="max-w-3xl mx-auto px-4 space-y-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="想要什么样的春联？"
            className="w-full p-5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg"
          />
          <button
            onClick={generateCouplet}
            disabled={loading}
            className={`w-full mt-8 ${loading ? 'bg-yellow-200' : 'bg-yellow-400 hover:bg-yellow-500'} text-black font-bold py-4 px-12 rounded-xl transition-colors text-lg shadow-md`}
          >
            {loading ? '生成中...' : '生成春联'}
          </button>
          {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
        </div>

        <div className="flex flex-col items-center space-y-12">
          <div className="flex items-center gap-8">
            <Lantern />
            <div className="bg-red-600 text-yellow-100 px-12 py-4 rounded-xl shadow-lg text-4xl font-bold tracking-[.25em]">
              {couplet.horizontal}
            </div>
            <Lantern />
          </div>
          
          <div className="flex justify-between items-center w-full max-w-lg gap-20">
            <div className="bg-red-600 text-yellow-100 px-8 py-16 rounded-xl shadow-lg text-3xl font-bold writing-vertical tracking-[.25em]">
              {couplet.upper}
            </div>
            <FuCharacter />
            <div className="bg-red-600 text-yellow-100 px-8 py-16 rounded-xl shadow-lg text-3xl font-bold writing-vertical tracking-[.25em]">
              {couplet.lower}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
