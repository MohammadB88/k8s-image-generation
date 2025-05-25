# k8s-image-generation
End-to-end guide to deploying, scaling, and testing image generation models (e.g., Stable Diffusion, ControlNet) on Kubernetes using modern inference engines and serving frameworks like KServe and vLLM.

With the help of this repo, one could deploy a text-to-image generator model using sdxl custom runtime provided by RedHat as well as a client UI to generate images:

- A S3 storage (*minio*) with a minimum of *100GB* is reqruired.
- Install odh-tech (deploy the custom workbench) using this image [Open Data Hub Tools & Extensions Companion](quay.io/rh-aiservices-bu/odh-tec:latest):  
- Add Huggingface token in the settings to authenticate to model registery
- Download required components for *"sdxl"* model from HuggingFace:
    - [stabilityai/stable-diffusion-xl-base-1.0](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0)
    - [stabilityai/stable-diffusion-xl-refiner-1.0](https://huggingface.co/stabilityai/stable-diffusion-xl-refiner-1.0)
- install *minio-cli*  (https://min.io/docs/minio/linux/reference/minio-mc.html) using below commands: 
  
  ````sh
    curl https://dl.min.io/client/mc/release/linux-amd64/mc \
    --create-dirs \
    -o $HOME/minio-binaries/minio

    chmod +x /$HOME/minio-binaries/minio
    
    export PATH=$PATH:$HOME/minio-binaries/

    minio alias set myminio HOSTNAME ACCESS_KEY SECRET_KEY

    minio admin info myminio
  ````

- mv only model file (*'sd_xl_base_1.0.safetensors'* and *'sd_xl_refiner_1.0.safetensors'*) from the corresponding directories to the path (*/models/*) in the *S3* storage, so that it could be deployed using the custom runtime:
  
  ````sh
    minio cp myminio/sdxl-models/stabilityai/stable-diffusion-xl-base-1.0/sd_xl_base_1.0.safetensors myminio/sdxl-models/models/sd_xl_base_1.0.safetensors

    minio cp myminio/sdxl-models/stabilityai/stable-diffusion-xl-refiner-1.0/sd_xl_refiner_1.0.safetensors myminio/sdxl-models/models/sd_xl_refiner_1.0.safetensors
  ````

- Add custom runtime [kserve-sdxl](quay.io/rh-aiservices-bu/kserve-sdxl:0.0.1) to the Serving Runtimes in OpenshiftA
- Deploy the model using custom runtime and the inferenceservice resources
- Deploy the [sdxl client UI]() adding 3 variables
  - *SDXL_ENDPOINT_URL=*
  - *GUARD_ENABLED=false*
  - *SAFETY_CHECK_ENABLED=false*

- Test model-Endpoint using:

    - from the predictor pod itself:
  ````sh
  curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [
      {
        "prompt": "grey tabby cat with green eyes hiding inside a cardboard box, photograph, nikon, detailed, 8k",
        "guidance_scale": 8.0,
        "num_inference_steps": 50,
        "crops_coords_top_left": [256, 0],
        "width": 1024,
        "height": 1024,
        "denoising_limit": 0.8
      }
    ]
  }' \
  http://localhost:8080/v1/models/model:predict

    ````

    - from the client pod:    
    ````sh
  curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [
      {
        "prompt": "grey tabby cat with green eyes hiding inside a cardboard box, photograph, nikon, detailed, 8k",
        "guidance_scale": 8.0,
        "num_inference_steps": 50,
        "crops_coords_top_left": [256, 0],
        "width": 1024,
        "height": 1024,
        "denoising_limit": 0.8
      }
    ]
  }' \
  http://sdxl-predictor.sdxl-studio.svc.cluster.local:8080/v1/models/model:predict
  ````

    ````sh
  curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [
      {
        "prompt": "grey tabby cat with green eyes hiding inside a cardboard box, photograph, nikon, detailed, 8k",
        "guidance_scale": 8.0,
        "num_inference_steps": 50,
        "crops_coords_top_left": [256, 0],
        "width": 1024,
        "height": 1024,
        "denoising_limit": 0.8
      }
    ]
  }' \
  http://localhost:8888/
    ````


Ideal for MLOps practitioners building scalable, GPU-accelerated image generation services on Kubernetes.