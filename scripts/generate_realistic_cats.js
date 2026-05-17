#!/usr/bin/env node
/**
 * 使用硅基流动 API 生成真实猫咪照片风格素材
 * 需要设置 SILICONFLOW_API_KEY 环境变量
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SILICONFLOW_API_KEY;
if (!API_KEY) {
  console.error('Error: 请设置 SILICONFLOW_API_KEY 环境变量');
  console.error('获取方式: https://cloud.siliconflow.cn/account/ak');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 素材配置 - 真实照片风格
const ASSETS = [
  {
    name: 'brush_idle',
    prompt: 'A cute orange tabby cat lying relaxed on a soft white blanket, looking content and sleepy, top-down view, realistic photography style, soft natural lighting, high detail fur texture, 4K quality, studio lighting',
    size: '1024x1024'
  },
  {
    name: 'brush_happy',
    prompt: 'A cute orange tabby cat being brushed with a soft brush, eyes closed in enjoyment, purring expression, realistic photography style, warm lighting, detailed fur, cozy indoor setting, 4K quality',
    size: '1024x1024'
  },
  {
    name: 'brush_alert',
    prompt: 'A cute orange tabby cat with ears slightly back, alert expression, noticing something behind, realistic photography style, natural lighting, detailed fur texture, indoor setting, 4K quality',
    size: '1024x1024'
  },
  {
    name: 'brush_looking',
    prompt: 'A cute orange tabby cat turning its head to look back at the camera, curious expression, realistic photography style, natural lighting, detailed fur, shallow depth of field, 4K quality',
    size: '1024x1024'
  },
  {
    name: 'brush_bite',
    prompt: 'A cute orange tabby cat gently biting a hand with soft paws, playful but slightly annoyed expression, realistic photography style, natural lighting, detailed fur texture, 4K quality',
    size: '1024x1024'
  },
  {
    name: 'pet_idle',
    prompt: 'A cute orange tabby cat sitting calmly, relaxed posture, looking forward, realistic photography style, soft natural lighting, detailed fur texture, clean background, 4K quality',
    size: '1024x1024'
  },
  {
    name: 'pet_happy',
    prompt: 'A cute orange tabby cat being petted on head, eyes closed in bliss, happy expression, realistic photography style, warm lighting, detailed fur, cozy setting, 4K quality',
    size: '1024x1024'
  },
  {
    name: 'pet_annoyed',
    prompt: 'A cute orange tabby cat with flattened ears, annoyed expression, about to swat, realistic photography style, natural lighting, detailed fur texture, indoor setting, 4K quality',
    size: '1024x1024'
  },
  {
    name: 'pet_bite',
    prompt: 'A cute orange tabby cat gently biting a finger, warning expression but still cute, realistic photography style, natural lighting, detailed fur, 4K quality',
    size: '1024x1024'
  },
  {
    name: 'bg_main',
    prompt: 'Cozy living room background with soft warm lighting, wooden floor, cat toys scattered, window with sunlight, realistic photography style, blurred background, bokeh effect, 4K quality',
    size: '1024x1024'
  }
];

function generateImage(asset) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'Kwai-Kolors/Kolors',
      prompt: asset.prompt,
      image_size: asset.size,
      batch_size: 1,
      num_inference_steps: 20,
      guidance_scale: 7.5
    });

    const options = {
      hostname: 'api.siliconflow.cn',
      port: 443,
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.images && response.images[0] && response.images[0].url) {
            resolve({
              name: asset.name,
              url: response.images[0].url
            });
          } else if (response.code) {
            reject(new Error(`API Error: ${response.message || JSON.stringify(response)}`));
          } else {
            reject(new Error(`Unexpected response: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nResponse: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', reject);
  });
}

async function main() {
  console.log('🐱 开始生成真实猫咪照片风格素材...\n');
  
  for (const asset of ASSETS) {
    try {
      process.stdout.write(`生成 ${asset.name}... `);
      
      // Generate image
      const result = await generateImage(asset);
      
      // Download image
      const filepath = path.join(OUTPUT_DIR, `${asset.name}.png`);
      await downloadImage(result.url, filepath);
      
      console.log('✅');
      
      // Wait a bit to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }
  
  console.log('\n🎉 完成！素材保存在:', OUTPUT_DIR);
}

main().catch(console.error);
