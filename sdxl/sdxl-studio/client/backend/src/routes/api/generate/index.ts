import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import WebSocket from 'ws';
import {
  getSDXLEndpoint,
  getGuardEnabled,
  getSafetyCheckEnabled,
  getGuardConfig,
  getSafetyCheckConfig,
  updateLastActivity,
} from '../../../utils/config'; // Adjust the import path as needed
import guard from '../../../services/guard';
import safetyChecker from '../../../services/image-safety-check';
import { Payload } from '../../../schema/payload';
import { safeImage } from '../../../utils/safeImage';

export default async (fastify: FastifyInstance): Promise<void> => {
  const decoder = new TextDecoder('utf-8');
  const jobTracker: Payload[] = [];

  // ============================
  // 1. POST Endpoint: Start Job
  // ============================
  fastify.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const {
      prompt,
      guidance_scale,
      num_inference_steps,
      crops_coords_top_left,
      width,
      height,
      denoising_limit,
    } = req.body as any;

    const data: Payload = {
      prompt,
      guidance_scale,
      num_inference_steps,
      crops_coords_top_left,
      width,
      height,
      denoising_limit,
      past_threshold: false,
      image_failed_check: false,
    };

    updateLastActivity();

    const guardConfig = getGuardConfig();
    const safetyCheckConfig = getSafetyCheckConfig();

    // Check all is well with the environment configurations
    if (getGuardEnabled() === 'true') {
      if (guardConfig.guardEndpointToken === '' || guardConfig.guardEndpointURL === '') {
        reply.code(403).send({
          message: 'Guardrails not configured correctly',
        });
        return;
      }
    }

    if (getSafetyCheckEnabled() === 'true') {
      if (
        safetyCheckConfig.safetyCheckEndpointToken === '' ||
        safetyCheckConfig.safetyCheckEndpointURL === ''
      ) {
        reply.code(403).send({
          message: 'Safety checker not configured correctly',
        });
        return;
      }
    }

    if (getGuardEnabled() === 'true') {
      const failedGuardCheck = await guard(data);
      if (failedGuardCheck) {
        reply.code(403).send({
          message:
            'Your query appears to contain inappropriate content. Please rephrase and try again',
        });
        return;
      }
    }

    // This is the original code to send the request to the SDXL endpoint
    // console.log(
    //   'Sending request to SDXL endpoint:',
    //   getSDXLEndpoint().sdxlEndpointURL + '/generate',
    // );

    //  This is the new code to send the request to the SDXL endpoint served with kserve at model:predict
    console.log(
      'Sending request to SDXL endpoint:',
      getSDXLEndpoint().sdxlEndpointURL,
    );

    // Send request to the SDXL endpoint with token to /generate API-Endpoint
    // const response = await axios.post(
    //   getSDXLEndpoint().sdxlEndpointURL +
    //     `/generate?user_key=${getSDXLEndpoint().sdxlEndpointToken}`,
    //   data,
    // );

    // Construct the payload as per KServe's V1 protocol
    const payload = {
      instances: [data],
    };

    // Send request to the SDXL endpoint with token to mode:predict API-Endpoint
    const response = await axios.post(
      getSDXLEndpoint().sdxlEndpointURL,
      payload,
    );

    const { job_id } = response.data;
    if (!job_id) {
      reply.code(500).send({ message: 'No job_id returned from generation endpoint.' });
      return;
    }
    jobTracker[parseInt(job_id)] = data;
    reply.send({ job_id });
  });

};
