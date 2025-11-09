import { OpenAIEmbeddings } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from './app.module';
import {
  ProductReview,
  ProductReviewDocument,
} from './embedding-processor/schemas/product-review.schema';

// Sample product SKUs for variety
const PRODUCT_SKUS = [
  'LAPTOP-001',
  'PHONE-002',
  'HEADPHONES-003',
  'CAMERA-004',
  'TABLET-005',
];

// Sample user IDs
const USER_IDS = [
  'user_001',
  'user_002',
  'user_003',
  'user_004',
  'user_005',
  'user_006',
  'user_007',
  'user_008',
  'user_009',
  'user_010',
];

// Review templates with different sentiments
const POSITIVE_REVIEWS = [
  'Adorei este produto! Superou minhas expectativas em todos os aspectos. A qualidade é excepcional e funciona perfeitamente.',
  'É exatamente o que eu estava procurando. Excelente custo-benefício e qualidade de construção. Recomendo muito!',
  'Produto fantástico! Entrega rápida, ótima embalagem e o item funciona perfeitamente. Com certeza comprarei novamente.',
  'Qualidade e desempenho excepcionais. Este produto facilitou muito minha vida. Vale cada centavo!',
  'Excelente compra! O produto chegou rapidamente e funciona exatamente como descrito. Muito satisfeito com esta compra.',
  'Produto incrível! A qualidade é de primeira e é exatamente o que eu precisava. O atendimento também foi ótimo.',
  'Perfeito! Este produto superou minhas expectativas. Ótimo custo-benefício e qualidade excelente. Altamente recomendado!',
  'Amei! Este produto é exatamente o que eu esperava. Ótima qualidade e entrega rápida. Muito feliz!',
  'Excepcional! Este produto funciona perfeitamente e a qualidade é excelente. Ótimo custo-benefício. Recomendo muito!',
  'Produto excelente! Entrega rápida, ótima qualidade e exatamente como descrito. Muito satisfeito com esta compra.',
  'Este é um produto fantástico! A qualidade é incrível e funciona perfeitamente. Ótimo custo-benefício.',
  'Produto perfeito! Exatamente o que eu precisava e a qualidade é excepcional. Entrega rápida também. Recomendo muito!',
  'Qualidade incrível! Este produto superou minhas expectativas. Ótimo custo-benefício e desempenho excelente. Adorei!',
  'Produto excepcional! A qualidade é de primeira e funciona perfeitamente. Ótimo custo-benefício. Recomendo muito!',
  'Excelente compra! Este produto é exatamente o que eu estava procurando. Ótima qualidade e entrega rápida.',
  'Fantástico! Este produto funciona perfeitamente e a qualidade é excelente. Ótimo custo-benefício. Muito satisfeito!',
  'Amo este produto! A qualidade é excepcional e funciona exatamente como descrito. Recomendo muito!',
  'Perfeito! Este produto superou minhas expectativas. Ótima qualidade e excelente custo-benefício. Comprarei novamente!',
  'Produto incrível! A qualidade é de primeira e funciona perfeitamente. Ótimo custo-benefício. Recomendo muito!',
  'Excepcional! Este produto é exatamente o que eu precisava. Ótima qualidade e entrega rápida. Muito feliz!',
];

const NEUTRAL_REVIEWS = [
  'O produto está ok. Funciona como esperado mas nada extraordinário. Qualidade decente pelo preço.',
  'É um produto decente. Faz o que deveria fazer mas nada mais. Qualidade média no geral.',
  'O produto funciona bem. Não é incrível mas também não é ruim. Cumpre adequadamente sua função.',
  'Produto médio. Funciona mas não há nada especial nele. Valor decente pelo preço.',
  'É um produto ok. Faz o que precisa fazer mas nada excepcional. Qualidade razoável no geral.',
  'O produto está bom. Funciona como descrito mas nada excepcional. Decente para o preço.',
  'É um produto decente. Funciona adequadamente mas nada de especial. Qualidade média.',
  'O produto está ok. Faz seu trabalho mas não há nada notável nele. Valor justo.',
  'É um produto bom. Funciona como esperado mas nada especial. Qualidade decente pelo preço.',
  'Produto médio. Funciona mas não há nada excepcional nele. Cumpre sua função.',
  'O produto é decente. Funciona bem mas nada extraordinário. Qualidade razoável no geral.',
  'É um produto ok. Faz o que precisa fazer mas nada incrível. Valor decente.',
  'O produto funciona bem. Não é ótimo mas também não é ruim. Qualidade média no geral.',
  'É um produto decente. Funciona adequadamente mas nada especial. Valor justo pelo preço.',
  'O produto está ok. Faz seu trabalho mas não há nada notável. Qualidade decente no geral.',
  'É um produto bom. Funciona como esperado mas nada excepcional. Valor médio.',
  'O produto é decente. Funciona mas não há nada excepcional nele. Qualidade razoável.',
  'É um produto ok. Faz o que precisa fazer mas nada incrível. Decente no geral.',
  'O produto funciona bem. Não é excepcional mas também não é ruim. Qualidade média.',
  'É um produto decente. Funciona adequadamente mas nada especial. Valor justo no geral.',
];

const NEGATIVE_REVIEWS = [
  'Muito decepcionado com este produto. Qualidade ruim e não funciona como anunciado. Não recomendo.',
  'Este produto é terrível. Quebrou após apenas alguns dias de uso. Desperdício de dinheiro e tempo.',
  'Produto horrível! Qualidade ruim, não funciona direito e o atendimento é inútil. Evitem este produto!',
  'Extremamente decepcionado. O produto é mal feito e não funciona como descrito. Lamento ter comprado.',
  'Este é um produto terrível. Qualidade de construção ruim e não funciona de jeito nenhum. Desperdício total de dinheiro.',
  'Produto de qualidade muito ruim. Não funciona como anunciado e parece barato. Não compraria novamente.',
  'Decepcionado com esta compra. O produto está com defeito e não funciona direito. Péssimo custo-benefício.',
  'Este produto é horrível. Qualidade ruim, não funciona e o atendimento é terrível. Evitem!',
  'Produto extremamente ruim. Não funciona como descrito e parece muito barato. Desperdício de dinheiro.',
  'Produto terrível! Qualidade ruim, não funciona direito e o atendimento é inútil.',
  'Muito decepcionado. Este produto é mal feito e não funciona de jeito nenhum. Lamento a compra.',
  'Produto de qualidade horrível. Não funciona como anunciado e parece muito barato. Não recomendo.',
  'Este é um produto terrível. Qualidade de construção ruim e não funciona direito. Desperdício de dinheiro.',
  'Extremamente decepcionado com este produto. Qualidade ruim e não funciona como descrito. Evitem!',
  'Produto muito ruim. Não funciona direito e parece mal feito. Não compraria novamente.',
  'Este produto é horrível. Qualidade ruim, não funciona e o atendimento é terrível. Lamento ter comprado.',
  'Decepcionado com esta compra. O produto está com defeito e não funciona como anunciado. Péssimo custo-benefício.',
  'Produto terrível! Qualidade ruim, não funciona direito e parece muito barato. Evitem este produto!',
  'Muito decepcionado. Este produto não funciona e parece mal feito. Desperdício total de dinheiro.',
  'Produto horrível! Qualidade ruim, não funciona como descrito e o atendimento é inútil. Evitem!',
];

// Additional review variations for more diversity
const ADDITIONAL_POSITIVE = [
  'Produto incrível! A atenção aos detalhes é impressionante e funciona perfeitamente. Melhor compra que já fiz!',
  'Este produto é revolucionário! Qualidade e desempenho excelentes. Vale cada centavo!',
  'Excepcional! Este produto superou todas as minhas expectativas. A qualidade é simplesmente incrível!',
  'Produto perfeito! O acabamento é excelente e funciona lindamente. Recomendo muito para todos!',
  'Este é um produto excepcional! A qualidade é excepcional e performa além das expectativas!',
  'Incrível! Este produto é exatamente o que eu precisava e mais. A qualidade é de primeira!',
  'Produto fantástico! A qualidade de construção é excelente e funciona perfeitamente. Ótimo investimento!',
  'Este produto é incrível! A qualidade é excepcional e funciona perfeitamente. Adorei!',
  'Produto excepcional! A atenção aos detalhes é impressionante e performa lindamente!',
  'Perfeito! Este produto é exatamente o que eu esperava. A qualidade é excepcional!',
];

const ADDITIONAL_NEUTRAL = [
  'O produto é funcional mas nada especial. Funciona mas há espaço para melhorias.',
  'É um produto básico que faz seu trabalho. Nada extraordinário mas funciona adequadamente.',
  'O produto está ok pelo preço. Funciona mas poderia ser melhor em algumas áreas.',
  'É um produto padrão. Funciona bem mas nada para se empolgar. Médio no geral.',
  'O produto é decente mas não excepcional. Funciona mas não há nada notável nele.',
  'É um produto funcional. Faz o que precisa fazer mas nada mais. Qualidade razoável.',
  'O produto está ok. Funciona mas não há nada excepcional nele. Valor médio.',
  'É um produto básico. Funciona adequadamente mas nada especial. Decente pelo preço.',
  'O produto está bom. Faz seu trabalho mas não há nada notável nele.',
  'É um produto padrão. Funciona mas nada excepcional. Qualidade média no geral.',
];

const ADDITIONAL_NEGATIVE = [
  'Este produto é um desastre completo! Qualidade ruim, não funciona e o atendimento é terrível!',
  'Pior produto que já comprei! Está quebrado e não funciona de jeito nenhum. Desperdício total de dinheiro!',
  'Isto é absolutamente terrível! O produto está com defeito e não funciona como anunciado. Evitem a todo custo!',
  'Produto horrível! Qualidade ruim, não funciona e o atendimento é inútil. Lamento ter comprado!',
  'Este produto é um pesadelo! Não funciona e parece muito barato. Desperdício de tempo e dinheiro!',
  'Experiência terrível! O produto está quebrado e não funciona de jeito nenhum. Não recomendaria para ninguém!',
  'Este é o pior produto de todos! Qualidade ruim, não funciona e o atendimento é horrível!',
  'Compra horrível! O produto está com defeito e não funciona como descrito. Decepção total!',
  'Este produto é um desastre! Não funciona e parece muito barato. Desperdício de dinheiro!',
  'Pior compra de todas! O produto está quebrado e não funciona de jeito nenhum. Evitem este produto!',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(): Date {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * 365); // Random date within last year
  return new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
}

function generateReviewText(): string {
  const sentiment = Math.random();

  if (sentiment < 0.4) {
    // 40% positive reviews
    return getRandomElement([...POSITIVE_REVIEWS, ...ADDITIONAL_POSITIVE]);
  } else if (sentiment < 0.7) {
    // 30% neutral reviews
    return getRandomElement([...NEUTRAL_REVIEWS, ...ADDITIONAL_NEUTRAL]);
  } else {
    // 30% negative reviews
    return getRandomElement([...NEGATIVE_REVIEWS, ...ADDITIONAL_NEGATIVE]);
  }
}

async function generateReviews() {
  try {
    console.log('Iniciando geração de avaliações...');

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    const productReviewModel = app.get<Model<ProductReviewDocument>>(
      getModelToken(ProductReview.name),
    );

    console.log('Gerando 100 avaliações de produtos...');

    const reviews: Array<{
      productSku: string;
      reviewText: string;
      userId: string;
      createdAt: Date;
    }> = [];

    for (let i = 0; i < 100; i++) {
      const review = {
        productSku: getRandomElement(PRODUCT_SKUS),
        reviewText: generateReviewText(),
        userId: getRandomElement(USER_IDS),
        createdAt: getRandomDate(),
      };

      reviews.push(review);

      // Show progress every 10 reviews
      if ((i + 1) % 10 === 0) {
        console.log(`Geradas ${i + 1}/100 avaliações...`);
      }
    }

    console.log('Inserindo avaliações no MongoDB...');

    // Insert all reviews into MongoDB
    const result = await productReviewModel.insertMany(reviews);

    console.log(
      `Inseridas com sucesso ${result.length} avaliações no MongoDB!`,
    );

    // Show some statistics
    const positiveCount = reviews.filter(
      (r) =>
        POSITIVE_REVIEWS.some((pr) =>
          r.reviewText.includes(pr.substring(0, 20)),
        ) ||
        ADDITIONAL_POSITIVE.some((pr) =>
          r.reviewText.includes(pr.substring(0, 20)),
        ),
    ).length;

    const negativeCount = reviews.filter(
      (r) =>
        NEGATIVE_REVIEWS.some((pr) =>
          r.reviewText.includes(pr.substring(0, 20)),
        ) ||
        ADDITIONAL_NEGATIVE.some((pr) =>
          r.reviewText.includes(pr.substring(0, 20)),
        ),
    ).length;

    const neutralCount = 100 - positiveCount - negativeCount;

    console.log('\nEstatísticas das Avaliações:');
    console.log(`Avaliações positivas: ${positiveCount}`);
    console.log(`Avaliações neutras: ${neutralCount}`);
    console.log(`Avaliações negativas: ${negativeCount}`);

    // Show unique product SKUs used
    const uniqueSkus = [...new Set(reviews.map((r) => r.productSku))];
    console.log(`\nSKUs únicos de produtos utilizados: ${uniqueSkus.length}`);
    console.log('SKUs:', uniqueSkus.join(', '));

    // Show unique user IDs used
    const uniqueUsers = [...new Set(reviews.map((r) => r.userId))];
    console.log(`\nIDs únicos de usuários utilizados: ${uniqueUsers.length}`);

    await app.close();
    console.log('\nGeração de avaliações concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar avaliações:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateReviews();
}

export { generateReviews };
