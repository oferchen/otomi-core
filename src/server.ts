/* eslint-disable @typescript-eslint/no-misused-promises, @typescript-eslint/require-await */
import express, { json, Request, Response } from 'express'
import { Server } from 'http'
import { bootstrapSops } from 'src/cmd/bootstrap'
import { genDrone } from 'src/cmd/gen-drone'
import { validateValues } from 'src/cmd/validate-values'
import { decrypt, encrypt } from 'src/common/crypt'
import { terminal } from 'src/common/debug'
import { hfValues } from './common/hf'
import { writeValues } from './common/values'

const d = terminal('server')
const app = express()
app.use(json())

let server: Server

export const stopServer = (): void => {
  server?.close()
}

app.get('/', async (req: Request, res: Response) => {
  res.send({ status: 'ok' })
})

type QueryParams = {
  envDir: string
}

app.get('/read', async (req: Request, res: Response) => {
  const { envDir } = req.query as QueryParams
  try {
    d.log('Request to read values repo')
    await decrypt(envDir)
    const values = await hfValues({ filesOnly: true, excludeSecrets: false }, envDir)
    res.status(200).send(values)
  } catch (error) {
    d.error(error)
    res.status(500).send(`${error}`)
  }
})

app.post('/update', async (req: Request, res: Response) => {
  const { envDir } = req.query as QueryParams
  const values = req.body as Record<string, any>
  try {
    d.log('Request to update values repo')
    await writeValues(values, false, envDir)
    await validateValues(envDir)
    await genDrone(envDir)
    await bootstrapSops(envDir)
    await encrypt(envDir)
    res.status(200).send('ok')
  } catch (error) {
    const err = `${error}`
    let status = 500
    d.error(err)
    if (err.includes('Values validation FAILED')) {
      status = 422
    }
    res.status(status).send(err)
  }
})

export const startServer = (): void => {
  server = app.listen(17771, '0.0.0.0')
  d.log(`Server listening on http://0.0.0.0:17771`)
}
